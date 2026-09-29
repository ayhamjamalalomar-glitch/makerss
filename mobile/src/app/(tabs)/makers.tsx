import { useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Chip, Empty, Loading, MakerRow, PageTitle, Txt } from '../../components/ui'
import { isCreator, listMembers, searchMakers, useLoad, useSpecialties, type MemberCard } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, F, PAD, R } from '../../lib/theme'

type Kind = 'all' | 'maker' | 'creator'

export default function Makers() {
  const insets = useSafeAreaInsets()
  const specs = useSpecialties()
  const all = useLoad(() => listMembers(300))
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind>('all')
  const [spec, setSpec] = useState<number | null>(null)
  const [hits, setHits] = useState<MemberCard[] | null>(null)

  // Server search (handles Arabic spelling variants) once the query has 2 letters.
  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) { setHits(null); return }
    let alive = true
    const id = setTimeout(() => { searchMakers(query).then((r) => alive && setHits(r)).catch(() => alive && setHits([])) }, 250)
    return () => { alive = false; clearTimeout(id) }
  }, [q])

  const usedSpecs = useMemo(() => specs.filter((s) => (all.data || []).some((m) => m.specialty_ids?.includes(s.id))), [specs, all.data])

  const list = useMemo(() => (hits ?? all.data ?? []).filter((m) =>
    (kind === 'all' || (kind === 'creator' ? isCreator(m) : !isCreator(m))) &&
    (spec == null || m.specialty_ids?.includes(spec)),
  ), [hits, all.data, kind, spec])

  const header = (
    <View>
      <PageTitle label="SC.02 / DIRECTORY" title={t('الصنّاع', 'Makers')} subtitle={t('مخرجون، مصوّرون، مونتيرون، وصنّاع محتوى من كل العالم العربي.', 'Directors, DOPs, editors and creators from across the Arab world.')} />
      <View style={{ marginHorizontal: PAD, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('ابحث بالاسم أو المدينة أو التخصص', 'Search by name, city or specialty')}
          placeholderTextColor={C.muted2}
          style={{ flex: 1, height: 46, color: C.text, fontFamily: F.body, fontSize: 15 }}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: PAD, marginTop: 14 }}>
        <Chip label={t('الكل', 'All')} on={kind === 'all'} onPress={() => setKind('all')} />
        <Chip label={t('صنّاع الإنتاج', 'Production')} on={kind === 'maker'} onPress={() => setKind('maker')} />
        <Chip label={t('صنّاع المحتوى', 'Creators')} on={kind === 'creator'} onPress={() => setKind('creator')} />
      </View>
      {kind !== 'creator' && usedSpecs.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: PAD, marginTop: 10 }}>
          <Chip label={t('كل التخصصات', 'All specialties')} on={spec == null} onPress={() => setSpec(null)} />
          {usedSpecs.map((s) => <Chip key={s.id} label={t(s.name_ar || s.name_en, s.name_en)} on={spec === s.id} onPress={() => setSpec(s.id)} />)}
        </ScrollView>
      )}
      <Txt size={12} color={C.muted} style={{ paddingHorizontal: PAD, marginTop: 16, marginBottom: 4 }}>{t(`${list.length} صانع`, `${list.length} makers`)}</Txt>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={all.loading && !hits ? [] : list}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MakerRow m={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={all.loading ? <Loading /> : <Empty text={kind === 'creator' ? t('باب صنّاع المحتوى فُتح الآن. كن من أوائل الأسماء هنا.', 'The creators directory just opened. Be one of the first names here.') : t('لا نتائج تطابق البحث.', 'No makers match.')} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border, marginStart: PAD + 68 }} />}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={all.reload} tintColor={C.accent} />}
      />
    </View>
  )
}
