import { Platform } from 'react-native'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { t, useLang } from '@/lib/i18n'
import { F, useTheme } from '@/lib/theme'

// Open on Home whatever the order of the tabs.
export const unstable_settings = { initialRouteName: 'index' }

export default function TabsLayout() {
  const { rtl } = useLang()
  const { c, dark } = useTheme()
  const tabs = [
    <NativeTabs.Trigger key="index" name="index">
      <NativeTabs.Trigger.Label>{t('الرئيسية', 'Home')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="makers" name="makers">
      <NativeTabs.Trigger.Label>{t('الصنّاع', 'Makers')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="projects" name="projects">
      <NativeTabs.Trigger.Label>{t('المشاريع', 'Projects')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'film', selected: 'film.fill' }} md="movie" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="calls" name="calls">
      <NativeTabs.Trigger.Label>{t('الفرص', 'Calls')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'megaphone', selected: 'megaphone.fill' }} md="campaign" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="account" name="account">
      <NativeTabs.Trigger.Label>{t('حسابي', 'Account')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
    </NativeTabs.Trigger>,
  ]
  return (
    <NativeTabs
      tintColor={c.accent}
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { fontFamily: F.bodyMedium, fontSize: 10, color: c.muted }, selected: { fontFamily: F.bodySemi, fontSize: 10, color: c.accent } }}
      badgeBackgroundColor={c.accent}
      blurEffect={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      minimizeBehavior="onScrollDown"
    >
      {/* Arabic reads right to left, so Home sits on the right (the iOS tab bar itself always lays out left to right). */}
      {rtl && Platform.OS !== 'web' ? [...tabs].reverse() : tabs}
    </NativeTabs>
  )
}
