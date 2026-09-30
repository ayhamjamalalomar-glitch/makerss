import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { t } from '@/lib/i18n'
import { alpha, onScreen, useTheme } from '@/lib/theme'
import { budgetLabel, cityLabel, COUNTRIES, formatDateAr, listSep, relativeAr } from '@/lib/constants'
import { label } from '@/lib/i18n'
import { displayName, formatFollowers, kindLabel, posterOf, totalFollowers, type MemberCard, type OpenCall, type Project } from '@/lib/data'
import { firstRole, isCreator, memberLine, specName } from '@/lib/specialties'
import type { Specialty } from '@/lib/supabase'
import { Avatar, Chevron, Icon, PosterFallback, Txt, Verified, tap } from './ui'

const press = (path: string) => () => { tap(); router.push(path as never) }

/** Project poster (2:3) with title and year under it. */
export function PosterCard({ p, width = 150 }: { p: Project; width?: number }) {
  const { c } = useTheme()
  const img = posterOf(p)
  return (
    <Pressable onPress={press(`/project/${p.id}`)} style={({ pressed }) => ({ width, gap: 8, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View style={{ width, aspectRatio: 2 / 3, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surface }}>
        {img ? <Image source={{ uri: img }} style={{ flex: 1 }} contentFit="cover" transition={250} /> : <PosterFallback title={p.title} />}
        {p.kind ? (
          <View style={{ position: 'absolute', top: 8, start: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(5,5,7,0.72)' }}>
            <Txt size={10} color={onScreen.text}>{kindLabel(p.kind)}</Txt>
          </View>
        ) : null}
      </View>
      <View style={{ gap: 1 }}>
        <Txt display weight="semi" size={14} lines={1}>{p.title}</Txt>
        <Txt size={11} color={c.muted} lines={1}>{[p.year, p.brand].filter(Boolean).join(' · ') || displayName(p.owner)}</Txt>
      </View>
    </Pressable>
  )
}

/** Member portrait card (3:4), black and white like a casting sheet. */
export function CastCard({ m, specialties, width = 160, rank }: { m: MemberCard; specialties: Specialty[]; width?: number; rank?: number }) {
  const { c } = useTheme()
  const role = firstRole(specialties, m)
  const audience = isCreator(m) ? totalFollowers(m) : 0
  return (
    <Pressable onPress={press(`/maker/${m.username}`)} style={({ pressed }) => ({ width, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View style={{ width, aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surfaceAlt }}>
        {m.avatar_url ? (
          <Image source={{ uri: m.avatar_url }} style={{ flex: 1 }} contentFit="cover" transition={250} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Txt display size={52} color={c.muted2} center style={{ lineHeight: 70 }}>{displayName(m).charAt(0)}</Txt></View>
        )}
        <LinearGradient colors={['rgba(5,5,7,0)', 'rgba(5,5,7,0.92)']} locations={[0.45, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', top: 8, start: 8, end: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {m.available ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(5,5,7,0.7)' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.live }} />
              <Txt size={10} color={c.live}>{t('متاح', 'Available')}</Txt>
            </View>
          ) : <View />}
          {rank !== undefined ? (
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: c.accent }}>
              <Txt mono size={11} color={c.onAccent}>#{String(rank).padStart(2, '0')}</Txt>
            </View>
          ) : m.is_founding ? <Verified size={18} /> : null}
        </View>
        <View style={{ position: 'absolute', bottom: 10, start: 10, end: 10, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ flexShrink: 1 }}><Txt display size={15} color={onScreen.text} lines={1}>{displayName(m)}</Txt></View>
            {rank !== undefined && m.is_founding ? <Verified size={14} /> : null}
          </View>
          <Txt size={11} color={onScreen.dim} lines={1}>{role}{audience > 0 ? ` · ${formatFollowers(audience)}` : ''}</Txt>
        </View>
      </View>
    </Pressable>
  )
}

/** One line in a list of members. */
export function MemberRow({ m, specialties, right }: { m: MemberCard; specialties: Specialty[]; right?: React.ReactNode }) {
  const { c } = useTheme()
  const place = [cityLabel(m.city), label(COUNTRIES, m.country)].filter(Boolean).join(listSep())
  return (
    <Pressable onPress={press(`/maker/${m.username}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}>
      <Avatar url={m.avatar_url} name={displayName(m)} size={54} radius={14} />
      <View style={{ flex: 1, gap: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ flexShrink: 1 }}><Txt display size={16} lines={1}>{displayName(m)}</Txt></View>
          {m.is_founding ? <Verified size={15} /> : null}
          {m.available ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.live }} /> : null}
        </View>
        <Txt size={13} color={c.text2} lines={1}>{memberLine(specialties, m)}</Txt>
        {place ? <Txt size={12} color={c.muted} lines={1}>{place}</Txt> : null}
      </View>
      {right ?? <Chevron />}
    </Pressable>
  )
}

export function placeOfCall(x: Pick<OpenCall, 'remote' | 'city' | 'country'>) {
  if (x.remote) return t('عن بُعد', 'Remote')
  return [cityLabel(x.city), label(COUNTRIES, x.country)].filter(Boolean).join(listSep())
}

/** An open call written like a production call sheet. */
export function CallCard({ call, specialties, applied, width }: { call: OpenCall; specialties: Specialty[]; applied?: boolean; width?: number }) {
  const { c } = useTheme()
  return (
    <Pressable onPress={press(`/call/${call.id}`)} style={({ pressed }) => ({ width, borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: c.surfaceAlt, borderBottomWidth: 1, borderStyle: 'dashed', borderColor: c.borderMid }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} />
        <View style={{ flex: 1 }}><Txt size={12} weight="medium" color={c.accent}>{kindLabel(call.kind) || t('مشروع', 'Project')}</Txt></View>
        {call.remote ? <Txt size={11} color={c.live}>{t('عن بُعد', 'Remote')}</Txt> : null}
      </View>
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Avatar url={call.owner?.avatar_url} name={displayName(call.owner)} size={42} radius={11} />
          <View style={{ flex: 1, gap: 1 }}>
            <Txt display size={16} lines={2}>{call.title}</Txt>
            <Txt size={12} color={c.muted} lines={1}>{[call.org || displayName(call.owner), placeOfCall(call)].filter(Boolean).join(' · ')}</Txt>
          </View>
        </View>
        {call.role_ids.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {call.role_ids.slice(0, 4).map((id) => (
              <View key={id} style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: alpha(c, 0.12) }}>
                <Txt size={11} color={c.accent}>{specName(specialties, id)}</Txt>
              </View>
            ))}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderColor: c.border }}>
          <View style={{ flex: 1, gap: 1 }}>
            <Txt size={11} color={c.muted2}>{t('الميزانية', 'Budget')}</Txt>
            <Txt size={12} weight="semi" color={c.accent} lines={1}>{budgetLabel(call.budget)}</Txt>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Txt size={11} color={c.muted2}>{t('آخر موعد', 'Deadline')}</Txt>
            <Txt size={12} weight="semi" lines={1}>{call.deadline ? formatDateAr(call.deadline) : t('مفتوح', 'Open')}</Txt>
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Txt size={11} color={c.muted2}>{applied ? t('طلبك', 'You') : t('المتقدّمون', 'Applicants')}</Txt>
            <Txt size={12} weight="semi" lines={1} color={applied ? c.success : c.text}>{applied ? t('قدّمت ✓', 'Applied ✓') : String(call.applicants_count)}</Txt>
          </View>
        </View>
        <Txt size={11} color={c.muted2}>{relativeAr(call.created_at)}</Txt>
      </View>
    </Pressable>
  )
}

/** Compact project row (search results, lists). */
export function ProjectRow({ p, sub }: { p: Pick<Project, 'id' | 'title' | 'year' | 'thumb_url' | 'thumbnail_url' | 'url'>; sub?: string }) {
  const { c } = useTheme()
  const img = posterOf(p)
  return (
    <Pressable onPress={press(`/project/${p.id}`)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 44, height: 66, borderRadius: 8, overflow: 'hidden', backgroundColor: c.surface }}>
        {img ? <Image source={{ uri: img }} style={{ flex: 1 }} contentFit="cover" /> : <PosterFallback />}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt display size={15} lines={2}>{p.title}</Txt>
        <Txt size={12} color={c.muted} lines={1}>{sub ?? (p.year ? String(p.year) : '')}</Txt>
      </View>
      <Icon name="film" size={16} color={c.muted2} />
    </Pressable>
  )
}
