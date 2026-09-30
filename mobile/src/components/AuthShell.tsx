import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { t, useLang } from '@/lib/i18n'
import { alpha, onScreen, useTheme } from '@/lib/theme'
import { IconBtn, Logo, Txt } from './ui'

/** Full screen dark page for sign in and join, like the website's auth pages. */
export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  const { c } = useTheme()
  const { rtl } = useLang()
  return (
    <View style={{ flex: 1, backgroundColor: c.screen }}>
      <LinearGradient colors={[alpha(c, 0.2), 'rgba(0,0,0,0)']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.5 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 22, gap: 26, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo size={12} color={onScreen.text} align={rtl ? 'right' : 'left'} />
            <IconBtn name="close" label={t('إغلاق', 'Close')} size={36} bg="rgba(243,239,231,0.08)" color={onScreen.text} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          </View>
          <View style={{ gap: 8, paddingTop: 16 }}>
            <Txt display size={32} color={onScreen.text}>{title}</Txt>
            {sub ? <Txt size={14} color={onScreen.dim}>{sub}</Txt> : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
