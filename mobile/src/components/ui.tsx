import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native'
import { Image } from 'expo-image'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { F, alpha, useTheme } from '@/lib/theme'
import { t, useLang } from '@/lib/i18n'

// ── helpers ─────────────────────────────────────────────────

const ARABIC = /[؀-ۿ]/
/** Right-to-left when the text itself is Arabic (for member-written text, like dir="auto" on the web). */
export const isArabic = (s: string | null | undefined) => !!s && ARABIC.test(s)

export const tap = () => { if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => null) }

/** Lays out children right to left in Arabic. Every screen and every sheet sits inside one. */
export function Dir({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { rtl } = useLang()
  return <View style={[{ flex: 1, direction: rtl ? 'rtl' : 'ltr' }, style]}>{children}</View>
}

// ── text ────────────────────────────────────────────────────

type Weight = 'regular' | 'medium' | 'semi' | 'bold'
const bodyFont: Record<Weight, string> = { regular: F.body, medium: F.bodyMedium, semi: F.bodySemi, bold: F.bodyBold }

export interface TxtProps {
  children?: ReactNode
  size?: number
  weight?: Weight
  color?: string
  /** Alexandria, for titles. */
  display?: boolean
  /** JetBrains Mono, for Latin labels and numbers only. */
  mono?: boolean
  center?: boolean
  /** Align by the text's own script instead of the app language (member-written text). */
  auto?: boolean
  lines?: number
  style?: StyleProp<TextStyle>
  onPress?: () => void
  selectable?: boolean
}

export function Txt({ children, size = 15, weight = 'regular', color, display, mono, center, auto, lines, style, onPress, selectable }: TxtProps) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const text = typeof children === 'string' ? children : Array.isArray(children) ? children.filter((x) => typeof x === 'string').join('') : ''
  const right = auto ? isArabic(text) : rtl
  // Latin-only text (names, links) keeps left-to-right order even inside the Arabic layout,
  // so punctuation and the "…" of a cut line land on the right side of the words.
  const latinOnly = !!text && !isArabic(text) && /[A-Za-z]/.test(text)
  const dir = auto ? (right ? 'rtl' : 'ltr') : latinOnly ? 'ltr' : rtl ? 'rtl' : 'ltr'
  const arabicGlyphs = rtl || isArabic(text)
  const family = mono ? F.mono : display ? (weight === 'semi' || weight === 'medium' ? F.displaySemi : F.display) : bodyFont[weight]
  // Arabic needs room above and below the line for its dots and marks.
  const lh = display ? size * (arabicGlyphs ? 1.5 : 1.18) : size * (arabicGlyphs ? 1.75 : 1.45)
  return (
    <Text
      onPress={onPress}
      numberOfLines={lines}
      selectable={selectable}
      style={[{ color: color || c.text, fontSize: size, fontFamily: family, lineHeight: lh, textAlign: center ? 'center' : right ? 'right' : 'left', writingDirection: dir }, style]}
    >
      {children}
    </Text>
  )
}

/** Page title in the display face. */
export function H({ children, size = 30, color, style, lines }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle>; lines?: number }) {
  return <Txt display size={size} color={color} style={style} lines={lines}>{children}</Txt>
}

// ── icons ───────────────────────────────────────────────────

/** SF Symbols on iOS, Material Symbols on Android and web. */
const ICONS = {
  home: ['house', 'home'], homeFill: ['house.fill', 'home'],
  people: ['person.2', 'group'], peopleFill: ['person.2.fill', 'group'],
  megaphone: ['megaphone', 'campaign'], megaphoneFill: ['megaphone.fill', 'campaign'],
  chat: ['bubble.left.and.bubble.right', 'forum'], chatFill: ['bubble.left.and.bubble.right.fill', 'forum'],
  person: ['person.crop.circle', 'account_circle'], personFill: ['person.crop.circle.fill', 'account_circle'],
  search: ['magnifyingglass', 'search'],
  back: ['chevron.backward', 'arrow_back_ios_new'], chevronLeft: ['chevron.left', 'chevron_left'], chevronRight: ['chevron.right', 'chevron_right'],
  close: ['xmark', 'close'], plus: ['plus', 'add'], check: ['checkmark', 'check'],
  share: ['square.and.arrow.up', 'ios_share'], flag: ['flag', 'flag'], more: ['ellipsis', 'more_horiz'],
  play: ['play.fill', 'play_arrow'], film: ['film', 'movie'], star: ['star.fill', 'star'],
  send: ['arrow.up', 'arrow_upward'], camera: ['camera', 'photo_camera'], photo: ['photo', 'image'],
  gear: ['gearshape', 'settings'], bell: ['bell', 'notifications'], tray: ['tray', 'inbox'],
  pencil: ['pencil', 'edit'], trash: ['trash', 'delete'], globe: ['globe', 'language'], moon: ['moon', 'dark_mode'],
  link: ['link', 'link'], location: ['mappin.and.ellipse', 'location_on'], clock: ['clock', 'schedule'],
  logout: ['rectangle.portrait.and.arrow.right', 'logout'], seal: ['checkmark.seal.fill', 'verified'],
  handshake: ['hand.raised', 'handshake'], envelope: ['envelope', 'mail'], filter: ['line.3.horizontal.decrease', 'filter_list'],
  grid: ['square.grid.2x2', 'grid_view'], list: ['list.bullet', 'list'], sparkles: ['sparkles', 'auto_awesome'],
  doc: ['doc.text', 'description'], block: ['nosign', 'block'], info: ['info.circle', 'info'],
} as const
export type IconName = keyof typeof ICONS

export function Icon({ name, size = 20, color, weight }: { name: IconName; size?: number; color?: string; weight?: 'regular' | 'medium' | 'semibold' | 'bold' }) {
  const { c } = useTheme()
  const [ios, md] = ICONS[name]
  return (
    <SymbolView
      name={{ ios, android: md, web: md } as SymbolViewProps['name']}
      size={size}
      tintColor={color || c.text}
      weight={weight}
      style={{ width: size, height: size }}
    />
  )
}

/** A chevron that points "forward" in the reading direction. */
export function Chevron({ size = 14, color }: { size?: number; color?: string }) {
  const { rtl } = useLang()
  const { c } = useTheme()
  return <Icon name={rtl ? 'chevronLeft' : 'chevronRight'} size={size} color={color || c.muted} />
}

// ── buttons & inputs ────────────────────────────────────────

type BtnVariant = 'primary' | 'outline' | 'soft' | 'danger' | 'ghost'

export function Btn({ children, onPress, variant = 'primary', disabled, busy, small, icon, style, full }: {
  children: ReactNode; onPress?: () => void; variant?: BtnVariant; disabled?: boolean; busy?: boolean; small?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>; full?: boolean
}) {
  const { c } = useTheme()
  const bg = variant === 'primary' ? c.accent : variant === 'soft' ? c.surfaceAlt : variant === 'danger' ? 'rgba(248,113,113,0.12)' : 'transparent'
  const fg = variant === 'primary' ? c.onAccent : variant === 'danger' ? c.danger : c.text
  const border = variant === 'outline' ? c.borderMid : variant === 'danger' ? 'rgba(248,113,113,0.35)' : 'transparent'
  return (
    <Pressable
      disabled={disabled || busy}
      onPress={() => { tap(); onPress?.() }}
      style={({ pressed }) => [{
        height: small ? 38 : 50, paddingHorizontal: small ? 16 : 24, borderRadius: 999, backgroundColor: bg, borderWidth: 1, borderColor: border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        alignSelf: full ? 'stretch' : 'flex-start', transform: [{ scale: pressed ? 0.98 : 1 }],
      }, style]}
    >
      {busy ? <ActivityIndicator color={fg} /> : (
        <>
          {icon && <Icon name={icon} size={small ? 14 : 16} color={fg} weight="semibold" />}
          {typeof children === 'string' ? <Txt size={small ? 13 : 15} weight="semi" color={fg} center>{children}</Txt> : children}
        </>
      )}
    </Pressable>
  )
}

/** Round icon button (header actions, close). */
export function IconBtn({ name, onPress, size = 40, color, bg, label }: { name: IconName; onPress: () => void; size?: number; color?: string; bg?: string; label: string }) {
  const { c } = useTheme()
  return (
    <Pressable accessibilityLabel={label} hitSlop={8} onPress={() => { tap(); onPress() }} style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg ?? c.surfaceAlt, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={name} size={size * 0.42} color={color || c.text} weight="semibold" />
    </Pressable>
  )
}

export function Chip({ children, on, onPress, dim }: { children: ReactNode; on?: boolean; onPress?: () => void; dim?: boolean }) {
  const { c } = useTheme()
  return (
    <Pressable
      onPress={() => { tap(); onPress?.() }}
      style={({ pressed }) => ({
        height: 36, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', borderWidth: 1,
        backgroundColor: on ? c.accent : 'transparent', borderColor: on ? c.accent : c.borderMid, opacity: dim ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      <Txt size={13} weight={on ? 'semi' : 'regular'} color={on ? c.onAccent : c.text2}>{children}</Txt>
    </Pressable>
  )
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
}

export function Label({ children, hint, color }: { children: ReactNode; hint?: string; color?: string }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
      <Txt size={13} weight="semi" color={color || c.text2}>{children}</Txt>
      {hint ? <Txt size={12} color={c.muted}>{hint}</Txt> : null}
    </View>
  )
}

export function Input({ label, hint, ltr, multiline, style, onDark, ...props }: TextInputProps & { label?: string; hint?: string; ltr?: boolean; onDark?: boolean }) {
  const { c, dark } = useTheme()
  const { rtl } = useLang()
  const value = typeof props.value === 'string' ? props.value : ''
  const right = ltr ? false : multiline && value ? isArabic(value) : rtl
  return (
    <View style={{ gap: 8 }}>
      {label ? <Label hint={hint} color={onDark ? 'rgba(243,239,231,0.62)' : undefined}>{label}</Label> : null}
      <TextInput
        placeholderTextColor={onDark ? 'rgba(243,239,231,0.35)' : c.muted2}
        selectionColor={c.accent}
        keyboardAppearance={dark || onDark ? 'dark' : 'light'}
        multiline={multiline}
        {...props}
        style={[{
          minHeight: multiline ? 110 : 50, paddingHorizontal: 16, paddingTop: multiline ? 14 : 0, paddingBottom: multiline ? 14 : 0,
          borderRadius: 14, borderWidth: 1, borderColor: onDark ? 'rgba(243,239,231,0.14)' : c.border, backgroundColor: onDark ? 'rgba(243,239,231,0.06)' : c.surfaceAlt, color: onDark ? '#F3EFE7' : c.text,
          fontFamily: F.body, fontSize: 16, textAlign: right ? 'right' : 'left', writingDirection: right ? 'rtl' : 'ltr',
          textAlignVertical: multiline ? 'top' : 'center',
        }, style]}
      />
    </View>
  )
}

export function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const { c } = useTheme()
  return <Switch value={value} disabled={disabled} onValueChange={(v) => { tap(); onChange(v) }} trackColor={{ true: c.accent, false: c.borderMid }} thumbColor="#fff" ios_backgroundColor={c.borderMid} />
}

/** Pill switcher for two or three sections. */
export function Segmented<K extends string>({ items, value, onChange }: { items: { key: K; label: string; badge?: number }[]; value: K; onChange: (k: K) => void }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, gap: 4 }}>
      {items.map((it) => {
        const on = it.key === value
        return (
          <Pressable key={it.key} onPress={() => { tap(); onChange(it.key) }} style={{ flex: 1, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: on ? c.accent : 'transparent' }}>
            <Txt size={13} weight={on ? 'semi' : 'regular'} color={on ? c.onAccent : c.muted} center lines={1}>{it.label}</Txt>
            {!!it.badge && <Badge n={it.badge} inverted={on} />}
          </Pressable>
        )
      })}
    </View>
  )
}

export function Badge({ n, inverted }: { n: number; inverted?: boolean }) {
  const { c } = useTheme()
  return (
    <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: inverted ? 'rgba(0,0,0,0.25)' : c.accent }}>
      <Txt size={11} weight="bold" color={inverted ? '#fff' : c.onAccent} center style={{ lineHeight: 14 }}>{n > 99 ? '99+' : String(n)}</Txt>
    </View>
  )
}

// ── surfaces ────────────────────────────────────────────────

export function Card({ children, style, onPress, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padded?: boolean }) {
  const { c } = useTheme()
  const base: ViewStyle = { backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: padded ? 18 : 0, gap: 12 }
  if (!onPress) return <View style={[base, style]}>{children}</View>
  return <Pressable onPress={() => { tap(); onPress() }} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}>{children}</Pressable>
}

type Tone = 'neutral' | 'green' | 'blue' | 'amber' | 'red'
const TONES: Record<Tone, [string, string]> = {
  neutral: ['rgba(128,124,116,0.18)', '#A8A29A'],
  green: ['rgba(74,222,128,0.14)', '#4ADE80'],
  blue: ['rgba(96,165,250,0.14)', '#60A5FA'],
  amber: ['rgba(251,191,36,0.14)', '#FBBF24'],
  red: ['rgba(248,113,113,0.14)', '#F87171'],
}
export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const [bg, fg] = TONES[tone]
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: bg }}>
      <Txt size={12} weight="semi" color={fg}>{children}</Txt>
    </View>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  const { c } = useTheme()
  const bg = tone === 'error' ? 'rgba(248,113,113,0.12)' : tone === 'success' ? 'rgba(74,222,128,0.12)' : c.surfaceAlt
  const fg = tone === 'error' ? c.danger : tone === 'success' ? c.success : c.text2
  return (
    <View style={{ padding: 14, borderRadius: 14, backgroundColor: bg, gap: 6 }}>
      {typeof children === 'string' ? <Txt size={14} color={fg}>{children}</Txt> : children}
    </View>
  )
}

export function Spinner({ pad = 40 }: { pad?: number }) {
  const { c } = useTheme()
  return <View style={{ padding: pad, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme()
  const o = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [o])
  return <Animated.View style={[{ backgroundColor: c.surfaceAlt, borderRadius: 14, opacity: o }, style]} />
}

export function Empty({ title, body, action, onAction }: { title: string; body?: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme()
  return (
    <View style={{ padding: 26, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderMid, gap: 8 }}>
      <Txt display size={18}>{title}</Txt>
      {body ? <Txt size={14} color={c.muted}>{body}</Txt> : null}
      {action && onAction ? <Btn small onPress={onAction} style={{ marginTop: 6 }}>{action}</Btn> : null}
    </View>
  )
}

/** Section title with an optional "see all" on the far side. */
export function Section({ title, sub, action, onAction, children }: { title: string; sub?: string; action?: string; onAction?: () => void; children?: ReactNode }) {
  const { c } = useTheme()
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt display size={21}>{title}</Txt>
          {sub ? <Txt size={13} color={c.muted}>{sub}</Txt> : null}
        </View>
        {action && onAction ? (
          <Pressable hitSlop={10} onPress={() => { tap(); onAction() }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 }}>
            <Txt size={13} weight="semi" color={c.accent}>{action}</Txt>
            <Chevron size={11} color={c.accent} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  )
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme()
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }, style]} />
}

/** A tappable settings style row. */
export function Row({ icon, title, sub, value, onPress, danger, right }: { icon?: IconName; title: string; sub?: string; value?: string; onPress?: () => void; danger?: boolean; right?: ReactNode }) {
  const { c } = useTheme()
  return (
    <Pressable disabled={!onPress} onPress={() => { tap(); onPress?.() }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, opacity: pressed ? 0.7 : 1 })}>
      {icon && (
        <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? 'rgba(248,113,113,0.12)' : alpha(c, 0.12) }}>
          <Icon name={icon} size={17} color={danger ? c.danger : c.accent} />
        </View>
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt size={15} weight="medium" color={danger ? c.danger : c.text}>{title}</Txt>
        {sub ? <Txt size={12} color={c.muted} lines={2}>{sub}</Txt> : null}
      </View>
      {value ? <Txt size={13} color={c.muted}>{value}</Txt> : null}
      {right}
      {onPress && !right ? <Chevron /> : null}
    </Pressable>
  )
}

export function Group({ children, title }: { children: ReactNode; title?: string }) {
  const { c } = useTheme()
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean)
  return (
    <View style={{ gap: 8 }}>
      {title ? <Txt size={12} weight="semi" color={c.muted} style={{ paddingHorizontal: 6 }}>{title}</Txt> : null}
      <View style={{ backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
        {items.map((ch, i) => (
          <View key={i}>
            {i > 0 && <Divider style={{ marginStart: 64 }} />}
            {ch}
          </View>
        ))}
      </View>
    </View>
  )
}

// ── people & posters ───────────────────────────────────────

export function Avatar({ url, name, size = 44, radius }: { url?: string | null; name?: string | null; size?: number; radius?: number }) {
  const { c } = useTheme()
  const r = radius ?? size / 2
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: r, backgroundColor: c.surfaceAlt }} contentFit="cover" transition={200} />
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
      <Txt display size={size * 0.4} color={c.muted} center style={{ lineHeight: size * 0.6 }}>{(name || 'م').trim().charAt(0)}</Txt>
    </View>
  )
}

export function Verified({ size = 16 }: { size?: number }) {
  const { c } = useTheme()
  return (
    <View accessibilityLabel={t('عضو مؤسس', 'Founding member')} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={size * 0.62} color={c.onAccent} weight="bold" />
    </View>
  )
}

/** Poster for a project with no image: dark frame with the title. */
export function PosterFallback({ title, size = 14 }: { title?: string; size?: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#15151A', alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 }}>
      <SymbolView name={{ ios: 'film', android: 'movie', web: 'movie' } as SymbolViewProps['name']} size={22} tintColor="rgba(243,239,231,0.35)" />
      {title ? <Txt display size={size} color="rgba(243,239,231,0.7)" center lines={3}>{title}</Txt> : null}
    </View>
  )
}

export function Logo({ size = 15, color, align = 'left' }: { size?: number; color?: string; align?: 'left' | 'right' }) {
  const { c } = useTheme()
  const style: TextStyle = { fontFamily: F.wordmark, fontSize: size, lineHeight: size * 1.08, letterSpacing: size * 0.04, color: color || c.text, textAlign: align }
  return (
    <View accessibilityLabel="Makers" style={{ direction: 'ltr' }}>
      <Text style={style}>MAKERS</Text>
      <Text style={style}>FILMMAKERS</Text>
      <Text style={style}>CREATORS</Text>
    </View>
  )
}

// ── screens ─────────────────────────────────────────────────

/** Top bar for pushed screens: back on the reading side, title, optional actions. */
export function Header({ title, right, onBack, transparent, light }: { title?: string; right?: ReactNode; onBack?: () => void; transparent?: boolean; light?: boolean }) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const insets = useSafeAreaInsets()
  const fg = light ? '#F3EFE7' : c.text
  const back = onBack || (() => (router.canGoBack() ? router.back() : router.replace('/')))
  return (
    <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: transparent ? 'transparent' : c.bg, zIndex: 10 }}>
      <IconBtn name={rtl ? 'chevronRight' : 'chevronLeft'} label={t('رجوع', 'Back')} onPress={back} color={fg} bg={light ? 'rgba(5,5,7,0.55)' : c.surfaceAlt} />
      <View style={{ flex: 1 }}>
        {title ? <Txt display size={17} color={fg} lines={1}>{title}</Txt> : null}
      </View>
      {right}
    </View>
  )
}

/** Big page title for the tab screens. */
export function TabTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <H size={32}>{title}</H>
        {sub ? <Txt size={14} color={c.muted}>{sub}</Txt> : null}
      </View>
      {right}
    </View>
  )
}

export function Screen({ children, header, scroll = true, padded = true, refreshControl, style, keyboard }: {
  children: ReactNode; header?: ReactNode; scroll?: boolean; padded?: boolean; refreshControl?: React.ReactElement<any>; style?: StyleProp<ViewStyle>; keyboard?: boolean
}) {
  const { c } = useTheme()
  const { rtl } = useLang()
  const insets = useSafeAreaInsets()
  const pad: ViewStyle = padded ? { paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 60, gap: 18 } : { paddingBottom: insets.bottom + 60 }
  const body = scroll ? (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[pad, style]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" refreshControl={refreshControl} contentInsetAdjustmentBehavior="never">
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1 }, style]}>{children}</View>
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, direction: rtl ? 'rtl' : 'ltr' }}>
      {header}
      {keyboard ? <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView> : body}
    </View>
  )
}

/** A native page sheet with its own title bar. Content keeps the app's reading direction. */
export function Sheet({ visible, onClose, title, children, footer, scroll = true }: { visible: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; scroll?: boolean }) {
  const { c } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Dir style={{ backgroundColor: c.bg }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
            <View style={{ flex: 1 }}><Txt display size={20}>{title}</Txt></View>
            <IconBtn name="close" label={t('إغلاق', 'Close')} onPress={onClose} size={34} />
          </View>
          {scroll ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : <View style={{ flex: 1, padding: 20, gap: 16 }}>{children}</View>}
          {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </Dir>
    </Modal>
  )
}

/** Pick one value from a list, in a sheet. */
export function SelectField({ label, value, options, onChange, placeholder }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; placeholder?: string }) {
  const { c } = useTheme()
  const [open, setOpen] = useStateSafe(false)
  const current = options.find((o) => o.value === value)
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <Pressable onPress={() => { tap(); setOpen(true) }} style={{ height: 50, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}><Txt size={16} color={current ? c.text : c.muted2} lines={1}>{current?.label || placeholder || t('اختر', 'Choose')}</Txt></View>
        <Chevron size={12} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ gap: 2 }}>
          {options.map((o) => (
            <Pressable key={o.value} onPress={() => { tap(); onChange(o.value); setOpen(false) }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, backgroundColor: o.value === value ? alpha(c, 0.12) : pressed ? c.surfaceAlt : 'transparent' })}>
              <View style={{ flex: 1 }}><Txt size={16} weight={o.value === value ? 'semi' : 'regular'}>{o.label}</Txt></View>
              {o.value === value && <Icon name="check" size={16} color={c.accent} weight="bold" />}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  )
}

// useState that ignores updates after unmount (sheets can close as a screen goes away).
function useStateSafe<T>(init: T) {
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])
  const [v, set] = useState(init)
  return [v, (x: T) => { if (alive.current) set(x) }] as const
}
