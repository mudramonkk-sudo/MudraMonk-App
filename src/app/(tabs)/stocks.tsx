import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { Chips, ErrorBox, Loading, s, StockRow, Tag } from '@/components/ui';
import { getStocks, searchStocks, Stock } from '@/lib/market';
import { C } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';

type Sort = 'active' | 'gain' | 'loss';

export default function Stocks() {
  const { data, error, loading, refreshing, refresh, retry } = useAsync((f) => getStocks(f));
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('active');

  const list: Stock[] = useMemo(() => {
    if (!data) return [];
    if (q.trim()) return searchStocks(data.stocks, q);
    const liquid = data.stocks.filter((x) => x.price * x.volume >= 5e7); // ₹5 Cr+ traded
    const sorted = [...liquid].sort((a, b) =>
      sort === 'gain' ? b.pct - a.pct : sort === 'loss' ? a.pct - b.pct : b.price * b.volume - a.price * a.volume);
    return sorted.slice(0, 50);
  }, [data, q, sort]);

  return (
    <View style={s.screen}>
      <View style={{ padding: 14, paddingBottom: 0 }}>
        <TextInput
          style={[s.input, { borderRadius: 14 }]}
          placeholder={`Search ${data ? data.stocks.length.toLocaleString('en-IN') : ''} NSE stocks…`}
          placeholderTextColor={C.muted}
          value={q}
          onChangeText={setQ}
          autoCapitalize="characters"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {!q ? (
          <View style={{ marginTop: 10 }}>
            <Chips<Sort> items={[{ key: 'active', label: 'Most Traded' }, { key: 'gain', label: 'Top Gainers' }, { key: 'loss', label: 'Top Losers' }]} value={sort} onChange={setSort} />
          </View>
        ) : null}
        {data ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: q ? 10 : 0 }}>
            <Tag text="DELAYED" />
            <Text style={s.note}>Updated {data.updated}</Text>
          </View>
        ) : null}
      </View>
      {loading ? <Loading /> : error && !data ? <ErrorBox msg={error} onRetry={retry} /> : (
        <FlatList
          data={list}
          keyExtractor={(x) => x.symbol}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, marginBottom: 20 }}
          renderItem={({ item, index }) => (
            <StockRow name={item.name} symbol={item.symbol} price={item.price} change={item.pct} last={index === list.length - 1} />
          )}
          ListEmptyComponent={<Text style={[s.note, { paddingVertical: 14 }]}>No stock found for “{q}”.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.blue} />}
        />
      )}
    </View>
  );
}
