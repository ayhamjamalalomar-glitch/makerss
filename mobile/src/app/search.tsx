import { useEffect, useState } from 'react'
import { Pressable, ScrollView, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { t, useLang } from '@/lib/i18n'
import { F, useTheme } from '@/lib/theme'
import { searchSite, type MemberCard, type ProjectHit } from '@/lib/data'
import { useSpecialties } from '@/lib/specialties'
import { Icon, Spinner, Txt } from '@/components/ui'
import { MemberRow, ProjectRow } from '@/components/cards'

/** Search makers and projects on the server (Arabic spelling variants and small typos still match). */
export default function Search() {
  useLang()
  const { c, dark } = useTheme()
  const { rtl } = useLang()
  const insets = useSafeAreaInsets()
  const specialties = useSpecialties()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<{ makers: MemberCard[]; projects: ProjectHit[] } | null>(null)

  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return }
    let alive = true
    setBusy(true)
    const timer = setTimeout(async () => {
      const r = await searchSite(q, { makers: 12, projects: 8 }).catch(() => ({ makers: [], projects: [] }))
      if (alive) { setRes(r); setBusy(false) }
    }, 250)
    return () => { alive = false; clearTimeout(timer) }
  }, [q])

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 48, borderRadius: 16, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
          <Icon name="search" size={17} color={c.accent} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder={t('ابحث عن صانع أو مشروع…', 'Search makers or projects…')}
            placeholderTextColor={c.muted2}
            keyboardAppearance={dark ? 'dark' : 'light'}
            returnKeyType="search"
            selectionColor={c.accent}
            style={{ flex: 1, height: 48, color: c.text, fontFamily: F.body, fontSize: 16, textAlign: rtl ? 'right' : 'left' }}
          />
          {!!q && <Pressable hitSlop={10} onPress={() => setQ('')}><Icon name="close" size={14} color={c.muted} /></Pressable>}
        </View>
        <Pressable hitSlop={8} onPress={() => router.back()}><Txt size={15} weight="semi" color={c.accent}>{t('إلغاء', 'Cancel')}</Txt></Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 18 }}>
        {q.trim().length < 2 ? (
          <Txt size={14} color={c.muted}>{t('اكتب اسماً أو تخصصاً أو مدينة أو اسم مشروع.', 'Type a name, a role, a city or a project title.')}</Txt>
        ) : busy && !res ? <Spinner /> : res && res.makers.length + res.projects.length === 0 ? (
          <Txt size={14} color={c.muted}>{t('لا نتائج. جرّب كلمة أخرى.', 'No results. Try another word.')}</Txt>
        ) : res ? (
          <>
            {res.makers.length > 0 && (
              <View>
                <Txt size={12} weight="semi" color={c.muted}>{t('الصنّاع', 'Makers')}</Txt>
                {res.makers.map((m) => <MemberRow key={m.id} m={m} specialties={specialties} />)}
              </View>
            )}
            {res.projects.length > 0 && (
              <View>
                <Txt size={12} weight="semi" color={c.muted}>{t('المشاريع', 'Projects')}</Txt>
                {res.projects.map((p) => <ProjectRow key={p.id} p={p} />)}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}
