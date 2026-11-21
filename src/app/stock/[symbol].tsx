import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppHeader, Card, Chips, Disclaimer, Loading, s, Section, Tag } from '@/components/ui';
import { TVWidget } from '@/components/Web';
import { getStocks } from '@/lib/market';
import { useApp } from '@/lib/store';
import { C, fmt, pct, upDown } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

type Tab = 'chart' | 'tech' | 'fin' | 'profile';

export default function StockScreen() {
  const { symbol = '' } = useLocalSearchParams<{ symbol: string }>();
  const sym = decodeURIComponent(symbol).toUpperCase();
  const { data, loading } = useAsync((f) => getStocks(f));
  const { isWatched, toggleWatch } = useApp();
  const [tab, setTab] = useState<Tab>('chart');
  const st = data?.stocks.find((x) => x.symbol === sym);
  // TradingView shows NSE only on its own site (embeds give an "only available on TradingView" popup),
  // so charts and financials use the same company's BSE listing.
  const tv = `BSE:${sym}`;
  const watched = isWatched(sym);

  return (
    <View style={s.screen}>
      <AppHeader back />
      <ScrollView>
        <Section title="">
          {loading ? <Loading /> : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 19, fontWeight: '800', color: C.navy }}>{st?.name ?? sym}</Text>
                <Text style={s.note}>NSE: {sym}</Text>
                {st ? (
                  <>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: C.navy, marginTop: 6 }}>₹{fmt(st.price)}</Text>
                    <Text style={{ color: upDown(st.change), fontWeight: '600' }}>{st.change >= 0 ? '+' : ''}{fmt(st.change)} ({pct(st.pct)}) today</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 }}><Tag text="DELAYED" /><Text style={s.note}>{data?.updated}</Text></View>
                  </>
                ) : <Text style={[s.note, { marginTop: 6 }]}>Price not in today’s list — chart below still works.</Text>}
              </View>
              <Pressable onPress={() => toggleWatch(sym)} style={{ backgroundColor: watched ? C.blue : C.sky, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }}>
                <Text style={{ color: watched ? '#fff' : C.blue, fontWeight: '700', fontSize: 12.5 }}>{watched ? '★ Watching' : '☆ Watch'}</Text>
              </Pressable>
            </View>
          )}

          {st ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {[['Open', st.open], ['Day High', st.high], ['Day Low', st.low], ['Volume', st.volume]].map(([k, v]) => (
                <View key={k as string} style={{ width: '48.5%', backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 10 }}>
                  <Text style={{ fontSize: 11, color: C.muted }}>{k as string}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.navy }}>{k === 'Volume' ? fmt(v as number, 0) : `₹${fmt(v as number)}`}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Section>

        <Section title="">
          <Chips<Tab>
            items={[{ key: 'chart', label: 'Chart' }, { key: 'tech', label: 'Technicals' }, { key: 'fin', label: 'Fundamentals' }, { key: 'profile', label: 'Company' }]}
            value={tab}
            onChange={setTab}
          />
          {tab === 'chart' ? (
            <>
              <TVWidget key="chart" widget="advanced-chart" height={460} config={{
                symbol: tv, interval: 'D', timezone: 'Asia/Kolkata', style: '1', allow_symbol_change: false,
                hide_side_toolbar: true, withdateranges: true, studies: ['STD;RSI', 'STD;MACD'],
              }} />
              <Text style={[s.note, { marginTop: 6 }]}>Candlesticks with RSI and MACD. Tap the indicator button on the chart to add moving averages.</Text>
            </>
          ) : null}
          {tab === 'tech' ? (
            <TVWidget key="tech" widget="technical-analysis" height={450} config={{ symbol: tv, interval: '1D', showIntervalTabs: true, displayMode: 'single' }} />
          ) : null}
          {tab === 'fin' ? (
            <TVWidget key="fin" widget="financials" height={620} config={{ symbol: tv, displayMode: 'regular' }} />
          ) : null}
          {tab === 'profile' ? (
            <TVWidget key="profile" widget="symbol-profile" height={480} config={{ symbol: tv }} />
          ) : null}
          <Card style={{ marginTop: 10, backgroundColor: C.warnBg, borderColor: '#F5DFB3' }}>
            <Text style={{ fontSize: 12, color: C.warnText, lineHeight: 18 }}>
              Charts, technical summary and financials are provided by TradingView (BSE listing of the same company, delayed). Technical readings are for learning only — not a buy or sell signal.
            </Text>
          </Card>
        </Section>
        <Disclaimer />
      </ScrollView>
    </View>
  );
}
