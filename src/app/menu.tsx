import { Href, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { s } from '@/components/ui';
import { useApp } from '@/lib/store';
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

// Side drawer: narrow white panel from the right, full height; rest of the page stays visible.
const WIDTH = Math.min(200, Math.round(Dimensions.get('window').width * 0.55));

export default function Menu() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const x = useRef(new Animated.Value(WIDTH)).current;
  const fade = x.interpolate({ inputRange: [0, WIDTH], outputRange: [1, 0] });

  useEffect(() => {
    Animated.timing(x, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [x]);

  const close = (then?: () => void) =>
    Animated.timing(x, { toValue: WIDTH, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
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
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(19,37,74,0.12)', opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View style={[st.panel, { width: WIDTH, transform: [{ translateX: x }] }]}>
        <ScrollView contentContainerStyle={{ padding: 8, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }}>
          <View style={st.top}>
            <Pressable onPress={() => close(() => router.push('/profile'))} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
              <View style={st.userIc}><Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth={2} strokeLinecap="round"><Circle cx={12} cy={8} r={4} /><Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Svg></View>
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: C.blue }} numberOfLines={1}>{user ? user.name : 'Log in / Join'}</Text>
            </Pressable>
            <Pressable onPress={() => close()} hitSlop={10}><Text style={{ fontSize: 15, color: C.muted }}>✕</Text></Pressable>
          </View>
          {ITEMS.map(([l, h]) => <Item key={l} label={l} href={h} />)}
          <View style={{ height: 1, backgroundColor: C.line, marginVertical: 8 }} />
          {MORE.map(([l, h]) => <Item key={l} label={l} href={h} />)}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
            {[['YouTube', SOCIAL.youtube], ['Instagram', SOCIAL.instagram], ['X', SOCIAL.x]].map(([n, u]) => (
              <Pressable key={n} onPress={() => WebBrowser.openBrowserAsync(u)} style={st.social}>
                <Text style={{ color: C.blue, fontWeight: '500', fontSize: 10 }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[s.note, { marginTop: 10, fontSize: 10.5 }]}>{SOCIAL.email}</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  panel: { position: 'absolute', top: 0, bottom: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  userIc: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center' },
  item: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8 },
  itemText: { fontSize: 13, color: C.navy },
  social: { flex: 1, backgroundColor: C.sky, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
});
