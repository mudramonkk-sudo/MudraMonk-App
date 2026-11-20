<?php
/**
 * Plugin Name: Mudra Monk App API
 * Description: Lets the Mudra Monk mobile app log members in and sync their watchlist. Members keep subscriber-level access only.
 * Version: 1.0.0
 * Author: Mudra Monk
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) exit;

const MM_APP_NS          = 'mudramonk-app/v1';
const MM_APP_TOKENS_META = 'mm_app_tokens';     // hashed app tokens
const MM_APP_WATCH_META  = 'mm_app_watchlist';  // array of NSE symbols
const MM_APP_TOKEN_DAYS  = 90;
const MM_APP_MAX_TOKENS  = 5;                    // devices per member

/**
 * If your sign-up system stores "email verified" in user meta, put that meta key here
 * (value '1' = verified). Leave empty to skip the check.
 */
if (!defined('MM_APP_VERIFIED_META')) define('MM_APP_VERIFIED_META', '');

add_action('rest_api_init', function () {
    register_rest_route(MM_APP_NS, '/login', [
        'methods' => 'POST', 'callback' => 'mm_app_login', 'permission_callback' => '__return_true',
    ]);
    register_rest_route(MM_APP_NS, '/me', [
        'methods' => 'GET', 'callback' => 'mm_app_me', 'permission_callback' => 'mm_app_auth',
    ]);
    register_rest_route(MM_APP_NS, '/watchlist', [
        ['methods' => 'GET',  'callback' => 'mm_app_watch_get', 'permission_callback' => 'mm_app_auth'],
        ['methods' => 'POST', 'callback' => 'mm_app_watch_set', 'permission_callback' => 'mm_app_auth'],
    ]);
    register_rest_route(MM_APP_NS, '/logout', [
        'methods' => 'POST', 'callback' => 'mm_app_logout', 'permission_callback' => 'mm_app_auth',
    ]);
});

/* ---------- helpers ---------- */

function mm_app_ip() {
    return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : 'unknown';
}

function mm_app_hash($token) {
    return hash_hmac('sha256', $token, wp_salt('auth'));
}

/** Read the token from "Authorization: Bearer …" or "X-MM-Token" (some hosts strip Authorization). */
function mm_app_request_token(WP_REST_Request $r) {
    $h = $r->get_header('x_mm_token');
    if (!$h) {
        $auth = $r->get_header('authorization');
        if ($auth && stripos($auth, 'Bearer ') === 0) $h = trim(substr($auth, 7));
    }
    return is_string($h) && preg_match('/^[a-f0-9]{64}$/', $h) ? $h : '';
}

function mm_app_public_user(WP_User $u) {
    return ['name' => $u->display_name ?: $u->user_login, 'email' => $u->user_email];
}

function mm_app_watchlist($user_id) {
    $w = get_user_meta($user_id, MM_APP_WATCH_META, true);
    return is_array($w) ? array_values($w) : [];
}

/* ---------- auth check used by the protected routes ---------- */

function mm_app_auth(WP_REST_Request $r) {
    $token = mm_app_request_token($r);
    if (!$token) return new WP_Error('mm_no_token', 'Please log in.', ['status' => 401]);

    $hash  = mm_app_hash($token);
    $users = get_users([
        'meta_key' => MM_APP_TOKENS_META, 'meta_compare' => 'LIKE', 'meta_value' => $hash,
        'number' => 1, 'fields' => 'ID',
    ]);
    if (!$users) return new WP_Error('mm_bad_token', 'Session expired. Please log in again.', ['status' => 401]);

    $uid    = (int) $users[0];
    $tokens = get_user_meta($uid, MM_APP_TOKENS_META, true);
    if (!is_array($tokens) || empty($tokens[$hash]) || $tokens[$hash] < time()) {
        return new WP_Error('mm_bad_token', 'Session expired. Please log in again.', ['status' => 401]);
    }
    $r->set_param('_mm_uid', $uid);
    $r->set_param('_mm_hash', $hash);
    return true;
}

/* ---------- routes ---------- */

function mm_app_login(WP_REST_Request $r) {
    // simple brute-force guard: 10 tries per IP per 15 minutes
    $key   = 'mm_app_login_' . md5(mm_app_ip());
    $tries = (int) get_transient($key);
    if ($tries >= 10) return new WP_Error('mm_slow_down', 'Too many attempts. Please try again in 15 minutes.', ['status' => 429]);

    $email = sanitize_email((string) $r->get_param('email'));
    $pass  = (string) $r->get_param('password');
    if (!$email || $pass === '') return new WP_Error('mm_missing', 'Enter your email and password.', ['status' => 400]);

    $u = get_user_by('email', $email);
    $ok = $u ? wp_check_password($pass, $u->user_pass, $u->ID) : false;
    if (!$ok) {
        set_transient($key, $tries + 1, 15 * MINUTE_IN_SECONDS);
        return new WP_Error('mm_bad_login', 'Wrong email or password.', ['status' => 403]);
    }

    if (MM_APP_VERIFIED_META && get_user_meta($u->ID, MM_APP_VERIFIED_META, true) !== '1') {
        return new WP_Error('mm_unverified', 'Please verify your email first (check your inbox), then log in.', ['status' => 403]);
    }

    delete_transient($key);

    $token  = bin2hex(random_bytes(32));
    $tokens = get_user_meta($u->ID, MM_APP_TOKENS_META, true);
    $tokens = is_array($tokens) ? array_filter($tokens, function ($exp) { return $exp > time(); }) : [];
    arsort($tokens);
    $tokens = array_slice($tokens, 0, MM_APP_MAX_TOKENS - 1, true);
    $tokens[mm_app_hash($token)] = time() + MM_APP_TOKEN_DAYS * DAY_IN_SECONDS;
    update_user_meta($u->ID, MM_APP_TOKENS_META, $tokens);

    return ['token' => $token, 'user' => mm_app_public_user($u), 'watchlist' => mm_app_watchlist($u->ID)];
}

function mm_app_me(WP_REST_Request $r) {
    $u = get_user_by('id', (int) $r->get_param('_mm_uid'));
    return ['user' => mm_app_public_user($u), 'watchlist' => mm_app_watchlist($u->ID)];
}

function mm_app_watch_get(WP_REST_Request $r) {
    return ['watchlist' => mm_app_watchlist((int) $r->get_param('_mm_uid'))];
}

function mm_app_watch_set(WP_REST_Request $r) {
    $in   = $r->get_param('symbols');
    $list = [];
    if (is_array($in)) {
        foreach ($in as $s) {
            $s = strtoupper(preg_replace('/[^A-Za-z0-9&\-_.]/', '', (string) $s));
            if ($s !== '' && strlen($s) <= 30) $list[] = $s;
        }
    }
    $list = array_slice(array_values(array_unique($list)), 0, 200);
    update_user_meta((int) $r->get_param('_mm_uid'), MM_APP_WATCH_META, $list);
    return ['watchlist' => $list];
}

function mm_app_logout(WP_REST_Request $r) {
    $uid    = (int) $r->get_param('_mm_uid');
    $tokens = get_user_meta($uid, MM_APP_TOKENS_META, true);
    if (is_array($tokens)) {
        unset($tokens[$r->get_param('_mm_hash')]);
        update_user_meta($uid, MM_APP_TOKENS_META, $tokens);
    }
    return ['ok' => true];
}
