import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Card, Chips, Disclaimer, ErrorBox, Loading, PostCard, s, Section, StockRow, Tag } from '@/components/ui';
import { CAT, PAGES, SOCIAL } from '@/lib/config';
import { getPrices, Mover } from '@/lib/market';
import { C, fmt, pct, upDown } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';
import { getPosts } from '@/lib/wp';
import * as WebBrowser from 'expo-web-browser';

type MoverTab = 'g' | 'l' | 'v';

export default function Home() {
  const prices = useAsync((f) => getPrices(f));
  const analysis = useAsync(() => getPosts({ category: CAT.analysis, perPage: 3 }));
  const market = useAsync(() => getPosts({ category: CAT.market, perPage: 4 }));
  const [tab, setTab] = useState<MoverTab>('g');

  const refresh = () => { prices.refresh(); analysis.refresh(); market.refresh(); };
  const movers: Mover[] = prices.data ? prices.data[tab] ?? [] : [];

  return (
    <ScrollView style={s.screen} refreshControl={<RefreshControl refreshing={prices.refreshing} onRefresh={refresh} tintColor={C.blue} />}>
      {/* search */}
      <Pressable onPress={() => router.navigate('/stocks')} style={{ margin: 14, marginBottom: 0 }}>
        <View pointerEvents="none">
          <TextInput style={[s.input, { borderRadius: 14 }]} placeholder="Search NSE stocks — e.g. TCS, HDFC Bank" placeholderTextColor={C.muted} editable={false} />
        </View>
      </Pressable>

      {/* hero */}
      <View style={{ margin: 14, marginBottom: 0, borderRadius: 18, backgroundColor: C.blue, padding: 18 }}>
        <Text style={{ color: '#fff', fontSize: 21, fontWeight: '800' }}>Learn. Analyze. Grow.</Text>
        <Text style={{ color: '#DCE7FF', fontSize: 13, marginTop: 6, lineHeight: 19 }}>
          Market updates, IPO details, stock case studies and a free SIP calculator – in one calm place.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {['Education only', 'Official sources', 'Plain language', 'Free account'].map((t) => (
            <Text key={t} style={{ color: '#fff', fontSize: 11.5, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' }}>✓ {t}</Text>
          ))}
        </View>
      </View>

      {/* indices */}
      <Section title="Market Overview">
        {prices.loading ? <Loading /> : prices.error && !prices.data ? <ErrorBox msg={prices.error} onRetry={prices.retry} /> : prices.data ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {prices.data.items.map((x) => (
                <Card key={x.n} style={{ minWidth: 148, padding: 12 }}>
                  <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{x.n}</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: C.navy, marginVertical: 3 }}>{fmt(x.p)}</Text>
                  <Text style={{ fontSize: 12.5, fontWeight: '600', color: upDown(x.pct) }}>{x.ch >= 0 ? '+' : ''}{fmt(x.ch)} ({pct(x.pct)})</Text>
                </Card>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Tag text="DELAYED" />
              <Text style={s.note}>Updated {prices.data.updated}</Text>
            </View>
          </>
        ) : null}
      </Section>

      {/* movers */}
      <Section title="Market Movers" action="All stocks →" onAction={() => router.navigate('/stocks')}>
        <Chips<MoverTab> items={[{ key: 'g', label: 'Top Gainers' }, { key: 'l', label: 'Top Losers' }, { key: 'v', label: 'Most Active' }]} value={tab} onChange={setTab} />
        <Card style={{ paddingVertical: 4 }}>
          {prices.loading ? <Loading /> : movers.length ? movers.map((m, i) => (
            <StockRow key={m[1]} name={m[0]} symbol={m[1]} price={m[2]} change={m[3]} sub={`${m[0]} · ${m[4]}`} last={i === movers.length - 1} />
          )) : <Text style={[s.note, { paddingVertical: 12 }]}>No data right now.</Text>}
        </Card>
        <Text style={[s.note, { marginTop: 6 }]}>NSE stocks with at least ₹5 Cr traded. Prices are delayed.</Text>
      </Section>

      {/* case studies */}
      <Section title="Latest Case Studies" action="View all →" onAction={() => router.navigate({ pathname: '/analysis', params: { cat: String(CAT.analysis) } })}>
        <Card style={{ paddingVertical: 2 }}>
          {analysis.loading ? <Loading /> : analysis.error ? <ErrorBox msg={analysis.error} onRetry={analysis.retry} /> :
            analysis.data?.posts.map((p, i, a) => <PostCard key={p.id} post={p} last={i === a.length - 1} />)}
        </Card>
      </Section>

      {/* tools */}
      <Section title="Plan & Learn — Free Tools">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {[
            ['₹', 'SIP Calculator', 'SIP & lumpsum returns', () => router.navigate('/sip')],
            ['IPO', 'IPO Updates', 'Open, upcoming, listed', () => router.navigate('/ipo')],
            ['UN', 'Unlisted Shares', '139 companies', () => router.push(`/page/${PAGES.unlisted}`)],
            ['★', 'My Watchlist', 'Track your stocks', () => router.push('/watchlist')],
          ].map(([ic, t, sub, go]) => (
            <Pressable key={t as string} onPress={go as () => void} style={[s.card, { width: '48.5%', padding: 13 }]}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Text style={{ color: C.blue, fontWeight: '800', fontSize: 12 }}>{ic as string}</Text>
              </View>
              <Text style={{ fontWeight: '700', color: C.navy, fontSize: 13.5 }}>{t as string}</Text>
              <Text style={s.note}>{sub as string}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* news */}
      <Section title="Latest News" action="More →" onAction={() => router.navigate({ pathname: '/analysis', params: { cat: String(CAT.market) } })}>
        <Card style={{ paddingVertical: 2 }}>
          {market.loading ? <Loading /> : market.error ? <ErrorBox msg={market.error} onRetry={market.retry} /> :
            market.data?.posts.length ? market.data.posts.map((p, i, a) => <PostCard key={p.id} post={p} last={i === a.length - 1} />) :
            <Text style={[s.note, { paddingVertical: 12 }]}>No news yet.</Text>}
        </Card>
      </Section>

      {/* follow */}
      <Section title="Follow Mudra Monk">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[['YouTube', SOCIAL.youtube], ['Instagram', SOCIAL.instagram], ['X', SOCIAL.x]].map(([n, u]) => (
            <Pressable key={n} onPress={() => WebBrowser.openBrowserAsync(u)} style={[s.card, { flex: 1, padding: 11, alignItems: 'center' }]}>
              <Text style={{ color: C.blue, fontWeight: '700' }}>{n}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Disclaimer />
    </ScrollView>
  );
}
