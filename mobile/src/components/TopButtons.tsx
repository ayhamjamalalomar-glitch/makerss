import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useUnread } from '@/lib/unread'
import { Icon, Txt, tap } from './ui'

/** Messages, at the top of the tab screens, with the unread count. Only for signed-in members. */
export function MessagesButton({ onDark }: { onDark?: boolean }) {
  const { c } = useTheme()
  const { session } = useAuth()
  const unread = useUnread()
  if (!session) return null
  return (
    <Pressable
      accessibilityLabel={unread ? t(`الرسائل، ${unread} غير مقروءة`, `Messages, ${unread} unread`) : t('الرسائل', 'Messages')}
      hitSlop={8}
      onPress={() => { tap(); router.push('/messages') }}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: onDark ? 'rgba(243,239,231,0.1)' : c.surfaceAlt, opacity: pressed ? 0.7 : 1 })}
    >
      <Icon name="chat" size={18} color={onDark ? '#F3EFE7' : c.text} />
      {unread > 0 && (
        <View style={{ position: 'absolute', top: -3, end: -3, minWidth: 19, height: 19, paddingHorizontal: 5, borderRadius: 10, backgroundColor: c.rec, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: onDark ? '#050507' : c.bg }}>
          <Txt size={10} weight="bold" color="#fff" center style={{ lineHeight: 13 }}>{unread > 99 ? '99+' : String(unread)}</Txt>
        </View>
      )}
    </Pressable>
  )
}

/** "EN" in Arabic, "ع" in English: switches the whole app, like the website header. */
export function LangToggle({ onDark }: { onDark?: boolean }) {
  const { c } = useTheme()
  const { lang, setLang } = useLang()
  return (
    <Pressable
      accessibilityLabel={lang === 'ar' ? 'English' : 'العربية'}
      hitSlop={8}
      onPress={() => { tap(); setLang(lang === 'ar' ? 'en' : 'ar') }}
      style={({ pressed }) => ({ height: 34, minWidth: 40, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: onDark ? 'rgba(243,239,231,0.3)' : c.borderMid, opacity: pressed ? 0.7 : 1 })}
    >
      <Txt size={13} weight="semi" color={onDark ? '#F3EFE7' : c.text} center style={{ lineHeight: 18 }}>{lang === 'ar' ? 'EN' : 'ع'}</Txt>
    </Pressable>
  )
}
