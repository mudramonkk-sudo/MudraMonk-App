import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { Chips, ErrorBox, Loading, PostCard, s } from '@/components/ui';
import { CATEGORIES } from '@/lib/config';
import { C } from '@/lib/theme';
import { getPosts, Post } from '@/lib/wp';

/** All website posts, filterable by the site's categories (Stock Analysis, Market, IPO, Learn…). */
export default function Analysis() {
  const params = useLocalSearchParams<{ cat?: string }>();
  const [cat, setCat] = useState<number>(Number(params.cat ?? 25));
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (params.cat) setCat(Number(params.cat)); }, [params.cat]);

  const load = useCallback(async (p: number) => {
    setError(null);
    try {
      const r = await getPosts({ category: cat || undefined, page: p, perPage: 12, search: query || undefined });
      setPosts((cur) => (p === 1 ? r.posts : [...cur, ...r.posts]));
      setPages(r.totalPages);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load posts');
    } finally {
      setLoading(false); setMore(false); setRefreshing(false);
    }
  }, [cat, query]);

  useEffect(() => { setLoading(true); setPosts([]); load(1); }, [load]);

  return (
    <View style={s.screen}>
      <View style={{ padding: 14, paddingBottom: 0 }}>
        <TextInput
          style={[s.input, { borderRadius: 14, marginBottom: 10 }]}
          placeholder="Search articles…"
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setQuery(search.trim())}
          returnKeyType="search"
        />
        <Chips<number> items={CATEGORIES.map((c) => ({ key: c.id, label: c.name }))} value={cat} onChange={setCat} />
      </View>
      {loading ? <Loading /> : error && !posts.length ? <ErrorBox msg={error} onRetry={() => load(1)} /> : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, marginBottom: 20 }}
          renderItem={({ item, index }) => <PostCard post={item} last={index === posts.length - 1} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (!more && page < pages) { setMore(true); load(page + 1); } }}
          ListFooterComponent={more ? <ActivityIndicator style={{ margin: 12 }} color={C.blue} /> : undefined}
          ListEmptyComponent={<Text style={[s.note, { paddingVertical: 14 }]}>No articles here yet.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1); }} tintColor={C.blue} />}
        />
      )}
    </View>
  );
}
