import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { SITE } from '@/lib/config';
import { C } from '@/lib/theme';
import { Loading } from './ui';

const BASE_CSS = `
  body{font-family:-apple-system,Roboto,'Segoe UI',sans-serif;color:${C.navy};background:#fff;margin:0;padding:16px;font-size:16px;line-height:1.65;-webkit-text-size-adjust:100%}
  img,video,iframe,canvas,svg{max-width:100%!important;height:auto}
  figure{margin:12px 0}
  table{border-collapse:collapse;width:100%;display:block;overflow-x:auto;font-size:13px}
  th,td{border:1px solid ${C.line};padding:6px 8px;text-align:left;white-space:nowrap}
  th{background:${C.sky}}
  a{color:${C.blue}}
  h1,h2,h3{line-height:1.3}
  blockquote{border-left:4px solid ${C.blue};margin:12px 0;padding:6px 12px;background:${C.sky}}
`;

const same = (a: string, b: string) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '');

/** Open links to other sites in the browser, keep in-app ones in the WebView. */
function onNav(req: WebViewNavigation & { isTopFrame?: boolean }, opts: { allowPrefix?: string; initial?: string } = {}) {
  const url = req.url;
  if (req.isTopFrame === false) return true; // iframes (TradingView, YouTube embeds)
  if (url.startsWith('about:') || url.startsWith('data:')) return true;
  if (!url.startsWith('http')) { Linking.openURL(url).catch(() => {}); return false; } // mailto:, tel:, whatsapp:
  if (opts.allowPrefix && url.startsWith(opts.allowPrefix)) return true;
  if (opts.initial && same(url, opts.initial)) return true;
  if (Platform.OS === 'ios' && req.navigationType !== 'click') return true;
  WebBrowser.openBrowserAsync(url).catch(() => {});
  return false;
}

/** Renders a WordPress post's HTML (charts, tables, images all work as on the site). */
export function HtmlView({ html, header = '' }: { html: string; header?: string }) {
  const doc = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${SITE}/"><style>${BASE_CSS}</style></head><body>${header}${html}</body></html>`;
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: doc, baseUrl: SITE }}
      onShouldStartLoadWithRequest={(r) => onNav(r, { initial: SITE })}
      startInLoadingState
      renderLoading={() => <Loading />}
      style={{ flex: 1, backgroundColor: '#fff' }}
    />
  );
}

/** Shows a page of mudramonk.com inside the app with the website's header/footer hidden. */
const HIDE_CHROME = `
  (function(){var st=document.createElement('style');
  st.innerHTML='header.wp-block-template-part,footer.wp-block-template-part,.site-header,.site-footer,#wpadminbar{display:none!important}html{margin-top:0!important}';
  document.head.appendChild(st);})(); true;`;

export function SitePage({ path }: { path: string }) {
  const [ready, setReady] = useState(false);
  const url = `${SITE}/${path.replace(/^\//, '')}${path.endsWith('/') ? '' : '/'}`;
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        source={{ uri: url }}
        injectedJavaScriptBeforeContentLoaded={HIDE_CHROME}
        injectedJavaScript={HIDE_CHROME}
        onShouldStartLoadWithRequest={(r) => onNav(r, { allowPrefix: SITE })}
        onLoadEnd={() => setReady(true)}
        sharedCookiesEnabled
        style={{ flex: 1, opacity: ready ? 1 : 0 }}
      />
      {!ready ? <View style={{ position: 'absolute', inset: 0 }}><Loading /></View> : null}
    </View>
  );
}

/** TradingView embed widget (same widgets the website's Stock Search page uses). */
export function TVWidget({ widget, config, height }: { widget: 'advanced-chart' | 'symbol-profile' | 'financials' | 'technical-analysis'; config: Record<string, unknown>; height: number }) {
  const doc = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#fff}</style></head><body>
  <div class="tradingview-widget-container" style="height:100%;width:100%"><div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js" async>${JSON.stringify({ ...config, locale: 'en', colorTheme: 'light', isTransparent: false, width: '100%', height: '100%' })}</script></div></body></html>`;
  return (
    <View style={{ height, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.line, backgroundColor: '#fff' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: doc, baseUrl: 'https://www.tradingview.com' }}
        onShouldStartLoadWithRequest={(r) => onNav(r, { initial: 'https://www.tradingview.com' })}
        scrollEnabled={false}
        nestedScrollEnabled
        style={{ flex: 1 }}
      />
    </View>
  );
}
