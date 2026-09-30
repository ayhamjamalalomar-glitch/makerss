import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { t, useLang } from '@/lib/i18n'
import { F, useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useUnreadMessages } from '@/lib/messages'

export default function TabsLayout() {
  useLang()
  const { c, dark } = useTheme()
  const { session } = useAuth()
  const unread = useUnreadMessages(session?.user.id)
  return (
    <NativeTabs
      tintColor={c.accent}
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { fontFamily: F.bodyMedium, fontSize: 10, color: c.muted }, selected: { fontFamily: F.bodySemi, fontSize: 10, color: c.accent } }}
      badgeBackgroundColor={c.accent}
      blurEffect={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('الرئيسية', 'Home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="makers">
        <NativeTabs.Trigger.Label>{t('الصنّاع', 'Makers')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calls">
        <NativeTabs.Trigger.Label>{t('الفرص', 'Calls')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'megaphone', selected: 'megaphone.fill' }} md="campaign" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Label>{t('الرسائل', 'Messages')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' }} md="forum" />
        {unread > 0 ? <NativeTabs.Trigger.Badge>{unread > 99 ? '99+' : String(unread)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>{t('حسابي', 'Account')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
