import { Tabs } from 'expo-router/js-tabs';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppHeader } from '@/components/ui';
import { C } from '@/lib/theme';

const icon = (d: string) => ({ color }: { color: ColorValue }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={String(color ?? C.muted)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d={d} />
  </Svg>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '500' },
        tabBarStyle: { borderTopColor: C.line },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z') }} />
      <Tabs.Screen name="stocks" options={{ title: 'Stocks', tabBarIcon: icon('M4 19V9m6 10V5m6 14v-7m4 7H2') }} />
      <Tabs.Screen name="analysis" options={{ title: 'Analysis', tabBarIcon: icon('M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5') }} />
      <Tabs.Screen name="ipo" options={{ title: 'IPO', tabBarIcon: icon('M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z') }} />
      <Tabs.Screen name="sip" options={{ title: 'SIP Calc', tabBarIcon: icon('M5 3h14v18H5zM8 7h8M8 11h2m3 0h3M8 15h2m3 0h3M8 18h2m3 0h3') }} />
    </Tabs>
  );
}
