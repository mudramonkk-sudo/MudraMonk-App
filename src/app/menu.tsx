import { Href, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

// Side drawer like the website: white panel from the left, rest of the screen dimmed.
const WIDTH = Math.min(300, Math.round(Dimensions.get('window').width * 0.78));

export default function Menu() {
  const insets = useSafeAreaInsets();
  const x = useRef(new Animated.Value(-WIDTH)).current;
  const fade = x.interpolate({ inputRange: [-WIDTH, 0], outputRange: [0, 1] });

  useEffect(() => {
    Animated.timing(x, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [x]);

  const close = (then?: () => void) =>
    Animated.timing(x, { toValue: -WIDTH, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      router.back();
      if (then) setTimeout(then, 30);
    });

  const Item = ({ label, href }: { label: string; href: Href }) => (
    <Pressable onPress={() => close(() => router.navigate(href))} style={({ pressed }) => [st.item, pressed && { backgroundColor: C.sky }]}>
      <Text style={st.itemText}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,31,68,0.35)', opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View style={[st.panel, { width: WIDTH, transform: [{ translateX: x }] }]}>
        <ScrollView contentContainerStyle={{ padding: 14, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}>
          <View style={st.top}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Logo />
              <Text style={{ fontSize: 17, fontWeight: '800', color: C.navy }}>Mudra Monk</Text>
            </View>
            <Pressable onPress={() => close()} hitSlop={10}><Text style={{ fontSize: 20, color: C.muted }}>✕</Text></Pressable>
          </View>
          {ITEMS.map(([l, h]) => <Item key={l} label={l} href={h} />)}
          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
          {MORE.map(([l, h]) => <Item key={l} label={l} href={h} />)}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
            {[['YouTube', SOCIAL.youtube], ['Instagram', SOCIAL.instagram], ['X', SOCIAL.x]].map(([n, u]) => (
              <Pressable key={n} onPress={() => WebBrowser.openBrowserAsync(u)} style={st.social}>
                <Text style={{ color: C.blue, fontWeight: '700', fontSize: 12 }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.note, { marginTop: 12 }]}>Contact: {SOCIAL.email}</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#fff', borderTopRightRadius: 18, borderBottomRightRadius: 18, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  item: { paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10 },
  itemText: { fontSize: 14.5, color: C.navy, fontWeight: '500' },
  social: { flex: 1, backgroundColor: C.sky, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
});
