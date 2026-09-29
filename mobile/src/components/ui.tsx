import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { budgetLabel, formatDate } from '../lib/constants'
import { displayName, firstRole, kindLabel, posterOf, useSpecialties, type MemberCard, type OpenCall, type Project } from '../lib/data'
import { t } from '../lib/i18n'
import { C, F, PAD, R } from '../lib/theme'

export const tap = () => { if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {}) }

// ── Text ─────────────────────────────────────────────────────
type Variant = 'display' | 'heavy' | 'body' | 'medium' | 'bold' | 'mono'
const FAMILY: Record<Variant, string> = { display: F.display, heavy: F.displayHeavy, body: F.body, medium: F.bodyMedium, bold: F.bodyBold, mono: F.mono }

export function Txt({ v = 'body', size = 15, color = C.text, style, ...rest }: TextProps & { v?: Variant; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text {...rest} style={[{ fontFamily: FAMILY[v], fontSize: size, color, lineHeight: Math.round(size * (v === 'display' || v === 'heavy' ? 1.35 : 1.6)), textAlign: 'auto' }, style]} />
}

export function Wordmark({ size = 11 }: { size?: number }) {
  const s: TextStyle = { fontFamily: F.wordmark, fontSize: size, lineHeight: size * 1.05, color: C.text, letterSpacing: 0.4, writingDirection: 'ltr', textAlign: 'left' }
  return (
    <View style={{ direction: 'ltr' }} accessibilityLabel="Makers">
      <Text style={s}>MAKERS</Text>
      <Text style={s}>FILMMAKERS</Text>
      <Text style={s}>CREATORS</Text>
    </View>
  )
}

// ── Layout ───────────────────────────────────────────────────
/** Scrolling page. `bleed` lets a hero image run under the status bar and the transparent back button. */
export function Screen({ children, refreshing, onRefresh, header, bleed }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; header?: ReactNode; bleed?: boolean }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: bleed ? 0 : insets.top + 8, paddingBottom: insets.bottom + 110 }}
        contentInsetAdjustmentBehavior="never"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.accent} /> : undefined}
        showsVerticalScrollIndicator={false}
      >
        {header}
        {children}
      </ScrollView>
    </View>
  )
}

/** Big page title with a small Latin "scene" label above it, like the website's PageHeader. */
export function PageTitle({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <View style={{ paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 18 }}>
      <Txt v="mono" size={11} color={C.accent} style={{ letterSpacing: 1.5, writingDirection: 'ltr' }}>{label}</Txt>
      <Txt v="heavy" size={32} style={{ marginTop: 4 }}>{title}</Txt>
      {!!subtitle && <Txt size={14} color={C.muted} style={{ marginTop: 4 }}>{subtitle}</Txt>}
    </View>
  )
}

export function SectionHeader({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: PAD, marginBottom: 14, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Txt v="display" size={21}>{title}</Txt>
        {!!subtitle && <Txt size={13} color={C.muted}>{subtitle}</Txt>}
      </View>
      {onSeeAll && (
        <Pressable onPress={() => { tap(); onSeeAll() }} hitSlop={10}>
          <Txt v="medium" size={13} color={C.accent}>{t('عرض الكل', 'See all')}</Txt>
        </Pressable>
      )}
    </View>
  )
}

export function Rail({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: 12 }} decelerationRate="fast">
      {children}
    </ScrollView>
  )
}

export function Loading() {
  return <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={C.accent} /></View>
}

export function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ marginHorizontal: PAD, paddingVertical: 36, paddingHorizontal: 20, borderRadius: R.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: C.borderMid, backgroundColor: C.surface, alignItems: 'center', gap: 14 }}>
      <Txt color={C.muted} style={{ textAlign: 'center' }}>{text}</Txt>
      {action && onAction && <Btn label={action} onPress={onAction} />}
    </View>
  )
}

export function Btn({ label, onPress, kind = 'primary', style }: { label: string; onPress: () => void; kind?: 'primary' | 'ghost'; style?: StyleProp<ViewStyle> }) {
  const primary = kind === 'primary'
  return (
    <Pressable
      onPress={() => { tap(); onPress() }}
      style={({ pressed }) => [{ paddingHorizontal: 22, paddingVertical: 13, borderRadius: R.pill, alignItems: 'center', backgroundColor: primary ? C.accent : 'transparent', borderWidth: primary ? 0 : 1, borderColor: C.borderMid, opacity: pressed ? 0.8 : 1 }, style]}
    >
      <Txt v="bold" size={14} color={primary ? C.onAccent : C.text}>{label}</Txt>
    </Pressable>
  )
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress?.() }} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.pill, backgroundColor: on ? C.accent : 'transparent', borderWidth: 1, borderColor: on ? C.accent : C.border }}>
      <Txt v={on ? 'bold' : 'body'} size={13} color={on ? C.onAccent : C.text2}>{label}</Txt>
    </Pressable>
  )
}

export function Tag({ label, color = C.accent }: { label: string; color?: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(9,9,11,0.78)' }}>
      <Txt v="bold" size={10} color={color}>{label}</Txt>
    </View>
  )
}

export function Avatar({ uri, name, size = 44 }: { uri: string | null | undefined; name: string; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surfaceAlt }} contentFit="cover" transition={150} />
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
      <Txt v="display" size={size * 0.4} color={C.text2}>{(name || '?').trim().charAt(0)}</Txt>
    </View>
  )
}

export function FoundingBadge({ small }: { small?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: small ? 6 : 9, paddingVertical: small ? 1 : 3, borderRadius: R.pill, borderWidth: 1, borderColor: 'rgba(242,179,61,0.45)', backgroundColor: 'rgba(242,179,61,0.1)' }}>
      <Txt v="bold" size={small ? 9 : 11} color={C.accent}>{t('عضو مؤسس', 'Founding member')}</Txt>
    </View>
  )
}

// ── Cards ────────────────────────────────────────────────────
export function PosterCard({ p, width = 132 }: { p: Project; width?: number }) {
  const img = posterOf(p)
  const meta = [p.year, p.brand || displayName(p.owner)].filter(Boolean).join(' · ')
  return (
    <Pressable onPress={() => { tap(); router.push(`/project/${p.id}`) }} style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width, aspectRatio: 2 / 3, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
        {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <Txt v="display" size={14} color={C.text2} style={{ textAlign: 'center' }} numberOfLines={3}>{p.title}</Txt>
          </View>
        )}
        {!!p.kind && <View style={{ position: 'absolute', top: 8, start: 8 }}><Tag label={kindLabel(p.kind)} /></View>}
      </View>
      <Txt v="bold" size={13} numberOfLines={1} style={{ marginTop: 8 }}>{p.title}</Txt>
      {!!meta && <Txt size={11} color={C.muted} numberOfLines={1}>{meta}</Txt>}
    </Pressable>
  )
}

export function CastCard({ m, rank, width = 124 }: { m: MemberCard; rank?: number; width?: number }) {
  const specs = useSpecialties()
  const name = displayName(m)
  return (
    <Pressable onPress={() => { tap(); router.push(`/maker/${m.username}`) }} style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width, aspectRatio: 3 / 4, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border }}>
        {m.avatar_url ? <Image source={{ uri: m.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Txt v="heavy" size={40} color={C.muted2}>{name.charAt(0)}</Txt></View>
        )}
        <LinearGradient colors={['transparent', 'rgba(5,5,7,0.92)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }} />
        {rank != null && (
          <View style={{ position: 'absolute', top: 8, start: 8, backgroundColor: C.accent, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Txt v="mono" size={10} color={C.onAccent}>#{String(rank).padStart(2, '0')}</Txt>
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 8, start: 10, end: 10 }}>
          <Txt v="bold" size={13} numberOfLines={1}>{name}</Txt>
          <Txt size={11} color={C.text2} numberOfLines={1}>{firstRole(specs, m)}</Txt>
        </View>
      </View>
    </Pressable>
  )
}

export function MakerRow({ m }: { m: MemberCard }) {
  const specs = useSpecialties()
  const name = displayName(m)
  const place = [m.city, m.country].filter(Boolean).join(t('، ', ', '))
  return (
    <Pressable onPress={() => { tap(); router.push(`/maker/${m.username}`) }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: PAD, paddingVertical: 12, backgroundColor: pressed ? C.surface : 'transparent' })}>
      <Avatar uri={m.avatar_url} name={name} size={54} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt v="bold" size={15} numberOfLines={1} style={{ flexShrink: 1 }}>{name}</Txt>
          {m.is_founding && <FoundingBadge small />}
        </View>
        <Txt size={13} color={C.text2} numberOfLines={1}>{firstRole(specs, m)}</Txt>
        {!!place && <Txt size={12} color={C.muted} numberOfLines={1}>{place}</Txt>}
      </View>
      {m.available && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.live }} />}
    </Pressable>
  )
}

export function CallCard({ c }: { c: OpenCall }) {
  return (
    <Pressable onPress={() => { tap(); router.push(`/opportunity/${c.id}`) }} style={({ pressed }) => ({ marginHorizontal: PAD, padding: 16, borderRadius: R.lg, backgroundColor: pressed ? C.surfaceAlt : C.surface, borderWidth: 1, borderColor: C.border, gap: 8 })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {!!c.kind && <Tag label={kindLabel(c.kind)} />}
        {!!c.deadline && <Txt v="medium" size={11} color={C.muted}>{t('آخر موعد', 'Deadline')} {formatDate(c.deadline)}</Txt>}
      </View>
      <Txt v="display" size={17} numberOfLines={2}>{c.title}</Txt>
      {!!c.org && <Txt size={13} color={C.muted}>{c.org}</Txt>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 }}>
        <Txt v="medium" size={12} color={C.accent}>{budgetLabel(c.budget)}</Txt>
        <Txt size={12} color={C.text2}>{c.remote ? t('عن بُعد', 'Remote') : [c.city, c.country].filter(Boolean).join(t('، ', ', '))}</Txt>
      </View>
    </Pressable>
  )
}
