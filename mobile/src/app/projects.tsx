import { useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { arNorm } from '@/lib/constants'
import { PROJECT_KINDS, displayName, listProjects, type Project } from '@/lib/data'
import { Chip, Empty, Header, Input, Skeleton } from '@/components/ui'
import { PosterCard } from '@/components/cards'

/** Every project on Makers, newest first. */
export default function Projects() {
  useLang()
  const { c } = useTheme()
  const { width } = useWindowDimensions()
  const [all, setAll] = useState<Project[] | null>(null)
  const [kind, setKind] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { listProjects({ limit: 300 }).then(setAll).catch(() => setAll([])) }, [])

  const shown = useMemo(() => (all || []).filter((p) => {
    if (kind && p.kind !== kind) return false
    if (q.trim()) {
      const hay = arNorm([p.title, p.brand, displayName(p.owner), ...(p.credits || []).map((x) => x.profile ? displayName(x.profile) : x.display_name)].join(' '))
      if (!hay.includes(arNorm(q.trim()))) return false
    }
    return true
  }), [all, kind, q])

  const used = PROJECT_KINDS.filter((k) => (all || []).some((p) => p.kind === k.key))
  const col = (width - 40 - 12) / 2
  const refresh = async () => { setRefreshing(true); setAll(await listProjects({ limit: 300 }).catch(() => [])); setRefreshing(false) }

  const top = (
    <View style={{ gap: 12, paddingBottom: 16 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Input value={q} onChangeText={setQ} placeholder={t('ابحث باسم المشروع أو الجهة أو الطاقم', 'Search by title, brand or crew')} returnKeyType="search" />
      </View>
      {used.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          <Chip on={!kind} onPress={() => setKind(null)}>{t('الكل', 'All')}</Chip>
          {used.map((k) => <Chip key={k.key} on={kind === k.key} onPress={() => setKind(kind === k.key ? null : k.key)}>{t(k.ar, k.en)}</Chip>)}
        </ScrollView>
      )}
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title={t('المشاريع', 'Projects')} />
      {all === null ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 20 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ width: col, aspectRatio: 2 / 3 }} />)}</View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p.id}
          numColumns={2}
          ListHeaderComponent={top}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ gap: 18, paddingBottom: 60 }}
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}
          renderItem={({ item }) => <PosterCard p={item} width={col} />}
          ListEmptyComponent={<View style={{ paddingHorizontal: 20 }}><Empty title={all.length ? t('لا نتائج', 'No results') : t('لا توجد مشاريع بعد', 'No projects yet')} /></View>}
        />
      )}
    </View>
  )
}
