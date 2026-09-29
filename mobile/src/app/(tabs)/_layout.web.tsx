// Web preview only (makerss.net/app): a bottom tab bar like the iPhone one. The native app uses NativeTabs in _layout.tsx.
import { Tabs } from 'expo-router'
import { Text, type ColorValue } from 'react-native'
import { t } from '../../lib/i18n'
import { C, F } from '../../lib/theme'

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 18 }}>{glyph}</Text>

export default function TabsLayoutWeb() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: 'rgba(9,9,11,0.96)', borderTopColor: C.border, height: 64, paddingBottom: 8 },
        tabBarLabelStyle: { fontFamily: F.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('الرئيسية', 'Home'), tabBarIcon: icon('⌂') }} />
      <Tabs.Screen name="makers" options={{ title: t('الصنّاع', 'Makers'), tabBarIcon: icon('◉') }} />
      <Tabs.Screen name="projects" options={{ title: t('المشاريع', 'Projects'), tabBarIcon: icon('▣') }} />
      <Tabs.Screen name="opportunities" options={{ title: t('الفرص', 'Open calls'), tabBarIcon: icon('✦') }} />
    </Tabs>
  )
}
