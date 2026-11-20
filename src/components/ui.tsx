import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { DISCLAIMER, LOGO_URL } from '@/lib/config';
import { C, fmt, pct, upDown } from '@/lib/theme';
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

/* ---------- Header: menu left, logo centre, profile right (same as website) ---------- */
export function AppHeader({ back }: { back?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <Pressable style={s.iconBtn} onPress={() => (back ? router.back() : router.push('/menu'))} accessibilityLabel={back ? 'Back' : 'Menu'}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2.2} strokeLinecap="round">
          {back ? <Path d="M15 5l-7 7 7 7" /> : <Path d="M4 7h16M4 12h16M4 17h10" />}
        </Svg>
      </Pressable>
      <Pressable style={s.brand} onPress={() => router.navigate('/')}>
        <Logo />
        <View>
          <Text style={s.brandName}>Mudra Monk</Text>
          <Text style={s.brandTag}>LEARN · ANALYZE · GROW</Text>
        </View>
      </Pressable>
      <Pressable style={s.iconBtn} onPress={() => router.push('/profile')} accessibilityLabel="Profile">
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2.2} strokeLinecap="round">
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </Svg>
      </Pressable>
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

export function StockRow({ name, symbol, price, change, sub, last }: { name: string; symbol: string; price: number; change: number; sub?: string; last?: boolean }) {
  return (
    <Pressable style={[s.row, last && { borderBottomWidth: 0 }]} onPress={() => router.push(`/stock/${encodeURIComponent(symbol)}`)}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={s.rowTitle}>{symbol}</Text>
        <Text style={s.rowSub} numberOfLines={1}>{sub ?? name}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.rowPrice}>₹{fmt(price)}</Text>
        <Text style={[s.rowChange, { color: upDown(change) }]}>{pct(change)}</Text>
      </View>
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
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 17, fontWeight: '800', color: C.navy },
  brandTag: { fontSize: 9, color: C.muted, letterSpacing: 0.5 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14 },
  section: { paddingHorizontal: 14, paddingTop: 14 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: '700', color: C.navy },
  h3: { fontSize: 14, fontWeight: '700', color: C.navy, marginBottom: 8 },
  link: { color: C.blue, fontWeight: '600', fontSize: 13 },
  tag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start' },
  chips: { gap: 6, paddingBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#E9EEF6' },
  chipOn: { backgroundColor: C.blue },
  chipText: { fontSize: 12.5, fontWeight: '600', color: C.muted },
  chipTextOn: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.navy },
  rowSub: { fontSize: 11.5, color: C.muted, marginTop: 2 },
  rowPrice: { fontSize: 14, fontWeight: '600', color: C.navy },
  rowChange: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  post: { flexDirection: 'row', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: C.sky },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  postTitle: { fontSize: 13.5, fontWeight: '600', color: C.navy, lineHeight: 19 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  btn: { backgroundColor: C.blue, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', marginTop: 12 },
  btnGhost: { backgroundColor: C.sky },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  disc: { fontSize: 11.5, color: C.muted, lineHeight: 17, padding: 14, paddingBottom: 24 },
  note: { fontSize: 11.5, color: C.muted, lineHeight: 17 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: C.navy, backgroundColor: '#fff' },
  label: { fontSize: 12.5, fontWeight: '600', color: C.muted, marginTop: 10, marginBottom: 5 },
  screen: { flex: 1, backgroundColor: C.bg },
});
