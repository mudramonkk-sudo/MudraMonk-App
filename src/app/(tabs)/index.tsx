import { Href, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, ScrollViewInstance, NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { IndexChart } from '@/components/IndexChart';
import { Card, Chips, Disclaimer, ErrorBox, Loading, PostCard, s, Section, StockRow } from '@/components/ui';
import { CAT, SOCIAL } from '@/lib/config';
import { getPrices, Index, Mover } from '@/lib/market';
import { C, fmt, pct, upDown } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';
import { getPosts } from '@/lib/wp';

type MoverTab = 'g' | 'l' | 'v';
const cat = (id: number): Href => ({ pathname: '/analysis', params: { cat: String(id) } });

const SLIDES: { a: string; b: string; c: string; text: string; cta: string; go: Href }[] = [
  { a: 'Learn. ', b: 'Analyze.', c: ' Grow.', text: 'Market updates, IPO details and stock case studies in one calm place.', cta: 'Explore now →', go: cat(CAT.analysis) },
  { a: 'Free ', b: 'SIP', c: ' Calculator', text: 'See how a small monthly SIP can grow over time.', cta: 'Calculate →', go: '/sip' },
  { a: 'IPO ', b: 'Updates', c: '', text: 'Open, upcoming and listed IPOs with key details.', cta: 'View IPOs →', go: '/ipo' },
  { a: 'Stock ', b: 'Case Studies', c: '', text: 'Plain-language fundamental analysis of Indian companies.', cta: 'Read now →', go: cat(CAT.analysis) },
];

function BannerArt() {
  const c = [[14, 70, 100, 78, 16, 1], [34, 64, 92, 70, 14, 0], [54, 50, 84, 56, 20, 1], [74, 44, 72, 48, 18, 1], [94, 40, 66, 44, 14, 0], [114, 24, 56, 30, 20, 1], [134, 12, 40, 16, 18, 1]];
  return (
    <Svg width={150} height={100} viewBox="0 0 160 110" style={{ position: 'absolute', right: 8, bottom: 14 }}>
      {c.map(([x, y1, y2, ry, h, up]) => (
        <React.Fragment key={x}>
          <Line x1={x} x2={x} y1={y1} y2={y2} stroke={up ? '#7FE0A4' : '#FF8A80'} />
          <Rect x={x - 4} y={ry} width={8} height={h} rx={1.5} fill={up ? '#7FE0A4' : '#FF8A80'} />
        </React.Fragment>
      ))}
      <Path d="M6 96 L50 66 L76 72 L118 36 L150 12 M138 10 L152 10 L152 24" stroke="#FFD45C" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Banner() {
  const W = Dimensions.get('window').width - 28;
  const ref = useRef<ScrollViewInstance>(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => { const next = (n + 1) % SLIDES.length; ref.current?.scrollTo({ x: next * W, animated: true }); return next; }), 4000);
    return () => clearInterval(t);
  }, [W]);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setI(Math.round(e.nativeEvent.contentOffset.x / W));
  return (
    <View style={{ marginHorizontal: 14, marginTop: 12, borderRadius: 18, overflow: 'hidden', backgroundColor: C.blue }}>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onEnd}>
        {SLIDES.map((sl) => (
          <Pressable key={sl.b} onPress={() => router.navigate(sl.go)} style={{ width: W, height: 150, padding: 16 }}>
            <BannerArt />
            <Text style={st.bTitle}>{sl.a}<Text style={{ color: '#FFD45C' }}>{sl.b}</Text>{sl.c}</Text>
            <Text style={st.bText}>{sl.text}</Text>
            <Text style={st.cta}>{sl.cta}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={st.dots} pointerEvents="none">
        {SLIDES.map((_, k) => <View key={k} style={[st.dot, k === i && st.dotOn]} />)}
      </View>
    </View>
  );
}

const TOOLS: { label: string; bg: string; fg: string; d: string; go: Href }[] = [
  { label: 'SIP\nCalculator', bg: '#EAF1FF', fg: '#1554D1', d: 'M5 3h14v18H5zM8 7h8M8 12h1m3 0h1M8 16h1m3 0h1', go: '/sip' },
  { label: 'IPO\nUpdates', bg: '#FFF3E6', fg: '#E07B12', d: 'M4 20h16M7 16v-4M12 16V8M17 16V9', go: '/ipo' },
  { label: 'Mutual\nFunds', bg: '#E9F8EF', fg: '#12A150', d: 'M12 20v-8M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z', go: cat(CAT.mf) },
  { label: 'Learn\nFinance', bg: '#F0EDFF', fg: '#6B4CE6', d: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5', go: cat(CAT.learn) },
];

export default function Home() {
  const prices = useAsync((f) => getPrices(f));
  const analysis = useAsync(() => getPosts({ category: CAT.analysis, perPage: 3 }));
  const market = useAsync(() => getPosts({ category: CAT.market, perPage: 4 }));
  const [tab, setTab] = useState<MoverTab>('g');
  const [chartFor, setChartFor] = useState<Index | null>(null);

  const refresh = () => { prices.refresh(); analysis.refresh(); market.refresh(); };
  const movers: Mover[] = prices.data ? prices.data[tab] ?? [] : [];
  const indices = (prices.data?.items ?? []).filter((x) => ['Nifty 50', 'Sensex', 'Bank Nifty'].includes(x.n));

  return (
    <>
      <ScrollView style={s.screen} refreshControl={<RefreshControl refreshing={prices.refreshing} onRefresh={refresh} tintColor={C.blue} />}>
        <Pressable onPress={() => router.navigate('/stocks')} style={st.search}>
          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round"><Path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" /></Svg>
          <Text style={{ color: C.muted, fontSize: 13.5 }}>Search NSE stocks — e.g. TCS, HDFC Bank</Text>
        </Pressable>

        <Banner />

        <Section title="Market Overview">
          {prices.loading ? <Loading /> : prices.error && !prices.data ? <ErrorBox msg={prices.error} onRetry={prices.retry} /> : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {indices.map((x) => (
                  <Pressable key={x.n} onPress={() => setChartFor(x)} style={st.ix}>
                    <Text style={st.ixN}>{x.n}</Text>
                    <Text style={st.ixV} numberOfLines={1} adjustsFontSizeToFit>{fmt(x.p)}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: upDown(x.pct) }} numberOfLines={1} adjustsFontSizeToFit>
                      {x.pct >= 0 ? '▲' : '▼'} {x.ch >= 0 ? '+' : ''}{fmt(x.ch)} ({pct(x.pct)})
                    </Text>
                    <View style={st.bar}><View style={{ width: `${Math.min(100, Math.abs(x.pct) * 30)}%`, height: '100%', backgroundColor: upDown(x.pct), borderRadius: 2 }} /></View>
                  </Pressable>
                ))}
              </View>
              <Text style={[s.note, { marginTop: 7, fontSize: 11 }]}>Updated {prices.data?.updated} · tap for chart</Text>
            </>
          )}
        </Section>

        <Section title="Market Movers" action="All stocks →" onAction={() => router.navigate('/stocks')}>
          <Chips<MoverTab> items={[{ key: 'g', label: 'Top Gainers' }, { key: 'l', label: 'Top Losers' }, { key: 'v', label: 'Most Active' }]} value={tab} onChange={setTab} />
          <Card style={{ paddingVertical: 2 }}>
            {prices.loading ? <Loading /> : movers.length ? movers.map((m, i) => (
              <StockRow key={m[1]} index={i} name={m[0]} symbol={m[1]} price={m[2]} change={m[3]} last={i === movers.length - 1} />
            )) : <Text style={[s.note, { paddingVertical: 12 }]}>No data right now.</Text>}
          </Card>
        </Section>

        <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 14 }}>
          {TOOLS.map((t) => (
            <Pressable key={t.label} onPress={() => router.navigate(t.go)} style={[st.tool, { backgroundColor: t.bg }]}>
              <View style={st.toolIc}>
                <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={t.fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d={t.d} /></Svg>
              </View>
              <Text style={st.toolT}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Section title="Latest Case Studies" action="View all →" onAction={() => router.navigate(cat(CAT.analysis))}>
          <Card style={{ paddingVertical: 2 }}>
            {analysis.loading ? <Loading /> : analysis.error ? <ErrorBox msg={analysis.error} onRetry={analysis.retry} /> :
              analysis.data?.posts.map((p, i, a) => <PostCard key={p.id} post={p} last={i === a.length - 1} />)}
          </Card>
        </Section>

        <Section title="Latest News" action="More →" onAction={() => router.navigate(cat(CAT.market))}>
          <Card style={{ paddingVertical: 2 }}>
            {market.loading ? <Loading /> : market.error ? <ErrorBox msg={market.error} onRetry={market.retry} /> :
              market.data?.posts.length ? market.data.posts.map((p, i, a) => <PostCard key={p.id} post={p} last={i === a.length - 1} />) :
              <Text style={[s.note, { paddingVertical: 12 }]}>No news yet.</Text>}
          </Card>
        </Section>

        <Section title="Follow Mudra Monk">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[['YouTube', SOCIAL.youtube], ['Instagram', SOCIAL.instagram], ['X', SOCIAL.x]].map(([n, u]) => (
              <Pressable key={n} onPress={() => WebBrowser.openBrowserAsync(u)} style={[s.card, { flex: 1, padding: 10, alignItems: 'center' }]}>
                <Text style={{ color: C.blue, fontWeight: '500', fontSize: 13 }}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Disclaimer />
      </ScrollView>
      <IndexChart index={chartFor} updated={prices.data?.updated} onClose={() => setChartFor(null)} />
    </>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 14, marginTop: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 11 },
  bTitle: { color: '#fff', fontSize: 19, fontWeight: '600' },
  bText: { color: '#DCE7FF', fontSize: 12.5, marginTop: 5, maxWidth: '58%', lineHeight: 17 },
  cta: { marginTop: 11, alignSelf: 'flex-start', backgroundColor: '#FFD45C', color: '#1B2A4A', fontSize: 12, fontWeight: '600', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, overflow: 'hidden' },
  dots: { position: 'absolute', bottom: 9, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotOn: { width: 16, backgroundColor: '#fff' },
  ix: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 10 },
  ixN: { fontSize: 12, color: C.muted, fontWeight: '500' },
  ixV: { fontSize: 15, fontWeight: '600', color: C.navy, marginVertical: 3 },
  bar: { height: 3, borderRadius: 2, backgroundColor: C.line, marginTop: 8, overflow: 'hidden' },
  tool: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  toolIc: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  toolT: { fontSize: 11.5, fontWeight: '500', color: C.navy, textAlign: 'center', lineHeight: 15 },
});
