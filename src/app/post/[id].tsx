import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { AppHeader, ErrorBox, Loading, s } from '@/components/ui';
import { HtmlView } from '@/components/Web';
import { DISCLAIMER } from '@/lib/config';
import { useApp } from '@/lib/store';
import { C } from '@/lib/theme';
import { useAsync } from '@/lib/useAsync';
import { getPost, niceDate } from '@/lib/wp';

const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, loading, retry } = useAsync(() => getPost(Number(id)), [id]);
  const { isSaved, toggleSave } = useApp();

  if (loading) return <View style={s.screen}><AppHeader back /><Loading /></View>;
  if (error || !data) return <View style={s.screen}><AppHeader back /><ErrorBox msg={error ?? 'Not found'} onRetry={retry} /></View>;

  const saved = isSaved(data.id);
  const header = `${data.image ? `<img src="${data.image}" style="width:100%;border-radius:12px;margin-bottom:10px">` : ''}
    <h1 style="font-size:22px;margin:4px 0 6px">${esc(data.title)}</h1>
    <div style="color:${C.muted};font-size:13px;margin-bottom:14px">${niceDate(data.date)}</div>`;
  const footer = `<p style="font-size:12px;color:${C.muted};border-top:1px solid ${C.line};padding-top:12px;margin-top:24px"><b>Disclaimer:</b> ${DISCLAIMER}</p>`;

  return (
    <View style={s.screen}>
      <AppHeader back />
      <View style={{ flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.line }}>
        <Pressable onPress={() => toggleSave({ id: data.id, title: data.title })} style={chip(saved)}>
          <Text style={{ color: saved ? '#fff' : C.blue, fontWeight: '700', fontSize: 12.5 }}>{saved ? '★ Saved' : '☆ Save'}</Text>
        </Pressable>
        <Pressable onPress={() => Share.share({ message: `${data.title}\n${data.link}` })} style={chip(false)}>
          <Text style={{ color: C.blue, fontWeight: '700', fontSize: 12.5 }}>Share</Text>
        </Pressable>
      </View>
      <HtmlView html={data.content + footer} header={header} />
    </View>
  );
}
const chip = (on: boolean) => ({ backgroundColor: on ? C.blue : C.sky, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10 });
