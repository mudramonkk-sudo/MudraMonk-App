import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppHeader, s } from '@/components/ui';
import { SitePage } from '@/components/Web';

/** Any mudramonk.com page inside the app: /page/unlisted-shares, /page/about-us … */
export default function PageScreen() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>();
  return (
    <View style={s.screen}>
      <AppHeader back />
      <SitePage path={slug} />
    </View>
  );
}
