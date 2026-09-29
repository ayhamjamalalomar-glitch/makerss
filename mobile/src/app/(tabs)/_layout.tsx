import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { t } from '../../lib/i18n'
import { C, F } from '../../lib/theme'

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={C.accent}
      backgroundColor={C.bg}
      labelStyle={{ fontFamily: F.bodyMedium, fontSize: 10 }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('الرئيسية', 'Home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="makers">
        <NativeTabs.Trigger.Label>{t('الصنّاع', 'Makers')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="projects">
        <NativeTabs.Trigger.Label>{t('المشاريع', 'Projects')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'film', selected: 'film.fill' }} md="movie" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="opportunities">
        <NativeTabs.Trigger.Label>{t('الفرص', 'Open calls')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'megaphone', selected: 'megaphone.fill' }} md="campaign" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
