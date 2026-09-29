import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Chip, Empty, Loading, PageTitle, PosterCard } from '../../components/ui'
import { listProjects, PROJECT_KINDS, useLoad } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, PAD } from '../../lib/theme'

const COLS = 3
const GAP = 12

export default function Projects() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const all = useLoad(() => listProjects({ limit: 200 }))
  const [kind, setKind] = useState<string | null>(null)
  const kinds = PROJECT_KINDS.filter((k) => (all.data || []).some((p) => p.kind === k.key))
  const list = useMemo(() => (all.data || []).filter((p) => !kind || p.kind === kind), [all.data, kind])
  const cardW = Math.floor((width - PAD * 2 - GAP * (COLS - 1)) / COLS)

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={list}
        key={COLS}
        numColumns={COLS}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PosterCard p={item} width={cardW} />}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: PAD }}
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <PageTitle label="SC.03 / FILMOGRAPHY" title={t('المشاريع', 'Projects')} subtitle={t('أعمال صنعها أعضاء Makers.', 'Work made by Makers members.')} />
            {kinds.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: PAD }}>
                <Chip label={t('الكل', 'All')} on={!kind} onPress={() => setKind(null)} />
                {kinds.map((k) => <Chip key={k.key} label={t(k.ar, k.en)} on={kind === k.key} onPress={() => setKind(k.key)} />)}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={all.loading ? <Loading /> : <Empty text={t('لا توجد مشاريع بعد.', 'No projects yet.')} />}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={all.reload} tintColor={C.accent} />}
      />
    </View>
  )
}
