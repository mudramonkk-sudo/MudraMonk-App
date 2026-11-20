import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, s } from '@/components/ui';
import { RESET_URL, SIGNUP_URL } from '@/lib/config';
import { useApp } from '@/lib/store';
import { C } from '@/lib/theme';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, login, logout, watchlist, saved } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) { setMsg('Enter your email and password.'); return; }
    setBusy(true); setMsg(null);
    try { await login(email.trim(), password); setPassword(''); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Login failed'); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.navy }}>{user ? 'My Profile' : 'Log in to Mudra Monk'}</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={{ fontSize: 22, color: C.muted }}>✕</Text></Pressable>
        </View>

        {user ? (
          <>
            <Card>
              <Text style={s.label}>Name</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.navy }}>{user.name}</Text>
              <Text style={s.label}>Email</Text>
              <Text style={{ fontSize: 15, color: C.navy }}>{user.email}</Text>
            </Card>
            <Button title={`★ Watchlist (${watchlist.length}) & Saved (${saved.length})`} ghost onPress={() => { router.back(); router.push('/watchlist'); }} />
            <Button title="Log out" ghost onPress={logout} />
          </>
        ) : (
          <Card>
            <Text style={s.note}>Use the same account you made on mudramonk.com.</Text>
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
            <Text style={s.label}>Password</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
            {msg ? <Text style={{ color: C.down, marginTop: 10, fontSize: 13 }}>{msg}</Text> : null}
            <Button title={busy ? 'Logging in…' : 'Log in'} onPress={submit} disabled={busy} />
            <Pressable onPress={() => WebBrowser.openBrowserAsync(RESET_URL)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: C.blue, fontWeight: '600' }}>Forgot password?</Text>
            </Pressable>
            <View style={{ height: 1, backgroundColor: C.line, marginVertical: 14 }} />
            <Text style={[s.note, { textAlign: 'center' }]}>New here? Join free — sign up with email verification on our website, then log in here.</Text>
            <Button title="Join free" ghost onPress={() => WebBrowser.openBrowserAsync(SIGNUP_URL)} />
          </Card>
        )}
        <Text style={[s.note, { marginTop: 14 }]}>Your watchlist works without an account. Logging in keeps it synced across devices.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
