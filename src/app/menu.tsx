import { Href, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo, s } from '@/components/ui';
import { CAT, PAGES, SOCIAL } from '@/lib/config';
import { C } from '@/lib/theme';

const cat = (id: number): Href => ({ pathname: '/analysis', params: { cat: String(id) } });

const ITEMS: [string, Href][] = [
  ['Home', '/'],
  ['Stock Analysis', cat(CAT.analysis)],
  ['Stock Search', '/stocks'],
  ['Market Update', cat(CAT.market)],
  ['SIP Calculator', '/sip'],
  ['IPO', '/ipo'],
  ['Unlisted Shares', `/page/${PAGES.unlisted}`],
  ['Mutual Funds', cat(CAT.mf)],
  ['Stock Market Learning', cat(CAT.learn)],
];
const MORE: [string, Href][] = [
  ['★ My Watchlist & Saved', '/watchlist'],
  ['About Us', `/page/${PAGES.about}`],
  ['Contact Us', `/page/${PAGES.contact}`],
  ['Privacy Policy', `/page/${PAGES.privacy}`],
];

export default function Menu() {
  const insets = useSafeAreaInsets();
  const go = (h: Href) => { router.back(); setTimeout(() => router.navigate(h), 50); };
  const Item = ({ label, href }: { label: string; href: Href }) => (
    <Pressable onPress={() => go(href)} style={({ pressed }) => [{ paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 }, pressed && { backgroundColor: C.sky }]}>
      <Text style={{ fontSize: 15, color: C.navy, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Logo /><Text style={{ fontSize: 18, fontWeight: '800', color: C.navy }}>Mudra Monk</Text></View>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={{ fontSize: 22, color: C.muted }}>✕</Text></Pressable>
      </View>
      {ITEMS.map(([l, h]) => <Item key={l} label={l} href={h} />)}
      <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
      {MORE.map(([l, h]) => <Item key={l} label={l} href={h} />)}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        {[['YouTube', SOCIAL.youtube], ['Instagram', SOCIAL.instagram], ['X', SOCIAL.x]].map(([n, u]) => (
          <Pressable key={n} onPress={() => WebBrowser.openBrowserAsync(u)} style={{ flex: 1, backgroundColor: C.sky, padding: 10, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: C.blue, fontWeight: '700' }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[s.note, { marginTop: 14 }]}>Contact: {SOCIAL.email}</Text>
    </ScrollView>
  );
}
