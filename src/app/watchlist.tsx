import { router } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AppHeader, Card, Loading, s, Section, StockRow } from '@/components/ui';
import { getStocks } from '@/lib/market';
import { useApp } from '@/lib/store';
import { C } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

export default function Watchlist() {
  const { watchlist, saved, user } = useApp();
  const { data, loading, refreshing, refresh } = useAsync((f) => getStocks(f));
  const rows = watchlist.map((sym) => ({ sym, st: data?.stocks.find((x) => x.symbol === sym) }));

  return (
    <View style={s.screen}>
      <AppHeader back />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}>
        {!user ? (
          <Pressable onPress={() => router.push('/profile')} style={{ margin: 14, marginBottom: 0, padding: 12, borderRadius: 12, backgroundColor: C.sky }}>
            <Text style={{ color: C.blue, fontWeight: '600', fontSize: 13 }}>Log in to keep your watchlist synced across devices →</Text>
          </Pressable>
        ) : null}
        <Section title={`My Watchlist (${watchlist.length})`}>
          <Card style={{ paddingVertical: 4 }}>
            {loading ? <Loading /> : rows.length ? rows.map(({ sym, st }, i) => (
              <StockRow key={sym} symbol={sym} name={st?.name ?? '—'} price={st?.price ?? 0} change={st?.pct ?? 0} last={i === rows.length - 1} />
            )) : <Text style={[s.note, { paddingVertical: 12 }]}>Open any stock and tap ☆ Watch to add it here.</Text>}
          </Card>
        </Section>
        <Section title={`Saved Articles (${saved.length})`}>
          <Card style={{ paddingVertical: 4 }}>
            {saved.length ? saved.map((p, i) => (
              <Pressable key={p.id} onPress={() => router.push(`/post/${p.id}`)} style={[s.row, i === saved.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[s.postTitle, { flex: 1 }]} numberOfLines={2}>{p.title}</Text>
              </Pressable>
            )) : <Text style={[s.note, { paddingVertical: 12 }]}>Tap ☆ Save on any article to keep it here.</Text>}
          </Card>
        </Section>
      </ScrollView>
    </View>
  );
}
