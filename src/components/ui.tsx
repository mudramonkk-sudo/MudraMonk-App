import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { DISCLAIMER, LOGO_URL } from '@/lib/config';
import { C, fmt, pct } from '@/lib/theme';
import { niceDate, Post } from '@/lib/wp';

/* ---------- Logo: the official website logo; drawn fallback if offline ---------- */
export function Logo({ size = 32 }: { size?: number }) {
  const [failed, setFailed] = React.useState(false);
  if (!failed) {
    return <Image source={{ uri: LOGO_URL }} style={{ width: size, height: size, borderRadius: size / 2 }} onError={() => setFailed(true)} accessibilityLabel="Mudra Monk logo" />;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={19} fill={C.blue} />
      <Rect x={9} y={22} width={3} height={8} rx={1} fill="#9FC0FF" />
      <Rect x={28} y={20} width={3} height={9} rx={1} fill="#9FC0FF" />
      <Path d="M12 27V13l8 9 8-9v14" fill="none" stroke="#fff" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M24 10l5-1-1 5" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/* ---------- Header: logo left; search, updates and menu (opens from the right) on the right ---------- */
const HIcon = ({ d, onPress, label }: { d: string; onPress: () => void; label: string }) => (
  <Pressable style={s.iconBtn} onPress={onPress} accessibilityLabel={label} hitSlop={4}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  </Pressable>
);

export function AppHeader({ back }: { back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      {back ? <HIcon d="M15 5l-7 7 7 7" label="Back" onPress={() => router.back()} /> : null}
      <Pressable style={s.brand} onPress={() => router.navigate('/')}>
        <Logo size={36} />
        <View>
          <Text style={s.brandName}>Mudra Monk</Text>
          <Text style={s.brandTag}>LEARN · ANALYZE · GROW</Text>
        </View>
      </Pressable>
      <HIcon d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" label="Search stocks" onPress={() => router.navigate('/stocks')} />
      <HIcon d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" label="Market updates" onPress={() => router.navigate({ pathname: '/analysis', params: { cat: '18' } })} />
      <HIcon d="M4 7h16M4 12h16M10 17h10" label="Menu" onPress={() => router.push('/menu')} />
    </View>
  );
}

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[s.card, style]}>{children}</View>
);

export const Section = ({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) => (
  <View style={s.section}>
    <View style={s.sectionHead}>
      <Text style={s.h2}>{title}</Text>
      {action ? <Pressable onPress={onAction} hitSlop={8}><Text style={s.link}>{action}</Text></Pressable> : null}
    </View>
    {children}
  </View>
);

export const Tag = ({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'blue' | 'up' | 'down' }) => {
  const bg = { warn: '#FFF1D6', blue: C.sky, up: '#E3F5EA', down: '#FDE7E6' }[tone];
  const fg = { warn: '#8A5A00', blue: C.blue, up: C.up, down: C.down }[tone];
  return <Text style={[s.tag, { backgroundColor: bg, color: fg }]}>{text}</Text>;
};

export function Chips<T extends string | number>({ items, value, onChange }: { items: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
      {items.map((it) => (
        <Pressable key={String(it.key)} onPress={() => onChange(it.key)} style={[s.chip, value === it.key && s.chipOn]}>
          <Text style={[s.chipText, value === it.key && s.chipTextOn]}>{it.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const AV = [['#EAF1FF', '#1554D1'], ['#FFF1E6', '#D9730D'], ['#E9F8EF', '#12A150'], ['#F0EDFF', '#6B4CE6'], ['#FDECEF', '#C2185B']];

export function StockRow({ name, symbol, price, change, last, index = 0 }: { name: string; symbol: string; price: number; change: number; sub?: string; last?: boolean; index?: number }) {
  const [bg, fg] = AV[index % AV.length];
  const up = change >= 0;
  return (
    <Pressable style={[s.row, last && { borderBottomWidth: 0 }]} onPress={() => router.push(`/stock/${encodeURIComponent(symbol)}`)}>
      <View style={[s.avatar, { backgroundColor: bg }]}><Text style={{ color: fg, fontWeight: '600', fontSize: 13 }}>{symbol[0]}</Text></View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={s.rowTitle}>{symbol}</Text>
        <Text style={s.rowSub} numberOfLines={1}>{name}</Text>
      </View>
      <Text style={s.rowPrice}>₹{fmt(price)}</Text>
      <Text style={[s.pill, { backgroundColor: up ? '#E8F7EE' : '#FDECEA', color: up ? C.up : C.down }]}>{pct(change)}</Text>
    </Pressable>
  );
}

export function PostCard({ post, last }: { post: Post; last?: boolean }) {
  return (
    <Pressable style={[s.post, last && { borderBottomWidth: 0 }]} onPress={() => router.push(`/post/${post.id}`)}>
      {post.image ? <Image source={{ uri: post.image }} style={s.thumb} /> : <View style={[s.thumb, s.thumbEmpty]}><Logo size={28} /></View>}
      <View style={{ flex: 1 }}>
        <Text style={s.postTitle} numberOfLines={3}>{post.title}</Text>
        <Text style={s.rowSub}>{niceDate(post.date)}</Text>
      </View>
    </Pressable>
  );
}

export const Loading = () => <View style={s.center}><ActivityIndicator color={C.blue} /></View>;

export const ErrorBox = ({ msg, onRetry }: { msg: string; onRetry?: () => void }) => (
  <View style={[s.center, { padding: 20 }]}>
    <Text style={{ color: C.muted, textAlign: 'center', marginBottom: 10 }}>{msg}</Text>
    {onRetry ? <Button title="Try again" onPress={onRetry} ghost /> : null}
  </View>
);

export const Button = ({ title, onPress, ghost, disabled }: { title: string; onPress: () => void; ghost?: boolean; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[s.btn, ghost && s.btnGhost, disabled && { opacity: 0.6 }]}>
    <Text style={[s.btnText, ghost && { color: C.blue }]}>{title}</Text>
  </Pressable>
);

export const Disclaimer = () => (
  <Text style={s.disc}><Text style={{ fontWeight: '700' }}>Disclaimer: </Text>{DISCLAIMER}</Text>
);

export const s = StyleSheet.create({
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandName: { fontSize: 16.5, fontWeight: '600', color: C.navy },
  brandTag: { fontSize: 9, color: C.muted, letterSpacing: 1, marginTop: 1 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14 },
  section: { paddingHorizontal: 14, paddingTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  h2: { fontSize: 15.5, fontWeight: '600', color: C.navy },
  h3: { fontSize: 14, fontWeight: '600', color: C.navy, marginBottom: 8 },
  link: { color: C.blue, fontWeight: '500', fontSize: 12.5 },
  tag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start' },
  chips: { gap: 7, paddingBottom: 10 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line },
  chipOn: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { fontSize: 12.5, fontWeight: '500', color: C.muted },
  chipTextOn: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  avatar: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pill: { fontSize: 11.5, fontWeight: '600', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, overflow: 'hidden', minWidth: 62, textAlign: 'center', marginLeft: 6 },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: C.navy },
  rowSub: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  rowPrice: { fontSize: 13.5, fontWeight: '500', color: C.navy },
  rowChange: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  post: { flexDirection: 'row', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: C.sky },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  postTitle: { fontSize: 13.5, fontWeight: '600', color: C.navy, lineHeight: 19 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  btn: { backgroundColor: C.blue, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', marginTop: 12 },
  btnGhost: { backgroundColor: C.sky },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14.5 },
  disc: { fontSize: 11.5, color: C.muted, lineHeight: 17, padding: 14, paddingBottom: 24 },
  note: { fontSize: 11.5, color: C.muted, lineHeight: 17 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.navy, backgroundColor: '#fff' },
  label: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginTop: 10, marginBottom: 5 },
  screen: { flex: 1, backgroundColor: C.bg },
});
