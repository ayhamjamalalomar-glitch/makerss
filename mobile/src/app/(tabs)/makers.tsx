import { useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View, useWindowDimensions } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { t, label, useLang } from '@/lib/i18n'
import { F, alpha, useTheme } from '@/lib/theme'
import { CONTENT_TYPES, COUNTRIES, arNorm, cityLabel } from '@/lib/constants'
import { useSpecialties, memberLine, isCreator, specName } from '@/lib/specialties'
import { listMembers, totalFollowers, type MemberCard } from '@/lib/data'
import { store } from '@/lib/storage'
import { Chip, Empty, Icon, IconBtn, Segmented, Sheet, Skeleton, TabTitle, Txt, Btn, tap } from '@/components/ui'
import { CastCard, MemberRow } from '@/components/cards'
import { MessagesButton } from '@/components/TopButtons'

type Type = 'all' | 'maker' | 'creator'
type Sort = 'default' | 'newest' | 'audience'

export default function Makers() {
  useLang()
  const { c, dark } = useTheme()
  const { rtl } = useLang()
  const params = useLocalSearchParams<{ type?: string; sort?: string; s?: string }>()
  const specialties = useSpecialties()
  const { width } = useWindowDimensions()
  const [all, setAll] = useState<MemberCard[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<Type>(params.type === 'creator' || params.type === 'maker' ? params.type : 'all')
  const [specialty, setSpecialty] = useState<number | 'all'>(params.s && /^\d+$/.test(params.s) ? Number(params.s) : 'all')
  const [content, setContent] = useState('all')
  const [country, setCountry] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sort, setSort] = useState<Sort>(params.sort === 'audience' || params.sort === 'newest' ? params.sort : 'default')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>(() => (store.get('mk-makers-view') === 'list' ? 'list' : 'grid'))

  // Links from the home screen ("Content creators", "Biggest audiences") set these.
  useEffect(() => { if (params.type === 'creator' || params.type === 'maker') setType(params.type) }, [params.type])
  useEffect(() => { if (params.sort === 'audience' || params.sort === 'newest') setSort(params.sort) }, [params.sort])
  useEffect(() => { listMembers().then(setAll) }, [])
  useEffect(() => { store.set('mk-makers-view', view) }, [view])

  const filtered = useMemo(() => {
    const list = (all || []).filter((m) => {
      if (type === 'creator' && !isCreator(m)) return false
      if (type === 'maker' && isCreator(m)) return false
      if (type !== 'creator' && specialty !== 'all' && !(m.specialty_ids || []).includes(specialty)) return false
      if (type === 'creator' && content !== 'all' && !(m.content_types || []).includes(content)) return false
      if (country !== 'all' && m.country !== country) return false
      if (verifiedOnly && !m.is_founding) return false
      if (availableOnly && !m.available) return false
      if (search.trim()) {
        const q = arNorm(search.trim())
        const hay = arNorm([m.full_name, m.name_ar, m.username, m.city, cityLabel(m.city), label(COUNTRIES, m.country), m.country, memberLine(specialties, m)].join(' '))
        if (!hay.includes(q)) return false
      }
      return true
    })
    if (sort === 'newest') return [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (sort === 'audience') return [...list].sort((a, b) => totalFollowers(b) - totalFollowers(a))
    return list
  }, [all, search, type, specialty, content, country, verifiedOnly, availableOnly, sort, specialties])

  const activeFilters = [specialty !== 'all', content !== 'all', country !== 'all', verifiedOnly, availableOnly, sort !== 'default'].filter(Boolean).length
  const clear = () => { setSpecialty('all'); setContent('all'); setCountry('all'); setVerifiedOnly(false); setAvailableOnly(false); setSort('default') }
  const usedCountries = COUNTRIES.filter((x) => (all || []).some((m) => m.country === x.ar))
  const usedSpecs = specialties.filter((s) => (all || []).some((m) => (m.specialty_ids || []).includes(s.id)))
  const refresh = async () => { setRefreshing(true); setAll(await listMembers()); setRefreshing(false) }

  const col = (width - 40 - 12) / 2

  const header = (
    <View style={{ gap: 14, paddingBottom: 16 }}>
      <TabTitle
        title={t('الصنّاع', 'Makers')}
        sub={all ? t(`${filtered.length} في الدليل`, `${filtered.length} in the directory`) : undefined}
        right={<View style={{ flexDirection: 'row', gap: 8 }}><IconBtn name={view === 'grid' ? 'list' : 'grid'} label={t('طريقة العرض', 'View')} onPress={() => setView(view === 'grid' ? 'list' : 'grid')} /><MessagesButton /></View>}
      />
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: 16, paddingHorizontal: 16, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border }}>
          <Icon name="search" size={17} color={c.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('ابحث بالاسم أو التخصص أو المدينة', 'Search by name, role or city')}
            placeholderTextColor={c.muted2}
            keyboardAppearance={dark ? 'dark' : 'light'}
            returnKeyType="search"
            style={{ flex: 1, color: c.text, fontFamily: F.body, fontSize: 15, textAlign: rtl ? 'right' : 'left', height: 50 }}
          />
          {!!search && <Pressable hitSlop={10} onPress={() => setSearch('')}><Icon name="close" size={14} color={c.muted} /></Pressable>}
        </View>
        <Segmented
          value={type}
          onChange={(k) => { setType(k); setSpecialty('all'); setContent('all') }}
          items={[{ key: 'all', label: t('الكل', 'All') }, { key: 'maker', label: t('صنّاع الإنتاج', 'Production') }, { key: 'creator', label: t('صنّاع المحتوى', 'Creators') }]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable onPress={() => { tap(); setFiltersOpen(true) }} style={{ height: 36, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: activeFilters ? c.accent : c.borderMid, backgroundColor: activeFilters ? alpha(c, 0.12) : 'transparent' }}>
            <Icon name="filter" size={14} color={activeFilters ? c.accent : c.text2} />
            <Txt size={13} color={activeFilters ? c.accent : c.text2}>{activeFilters ? t(`الفلاتر (${activeFilters})`, `Filters (${activeFilters})`) : t('الفلاتر', 'Filters')}</Txt>
          </Pressable>
          <Chip on={availableOnly} onPress={() => setAvailableOnly(!availableOnly)}>{t('متاح للعمل', 'Available')}</Chip>
          <Chip on={verifiedOnly} onPress={() => setVerifiedOnly(!verifiedOnly)}>{t('الأعضاء المؤسسون', 'Founding members')}</Chip>
          {type !== 'creator'
            ? usedSpecs.slice(0, 8).map((s) => <Chip key={s.id} on={specialty === s.id} onPress={() => setSpecialty(specialty === s.id ? 'all' : s.id)}>{specName(specialties, s.id)}</Chip>)
            : CONTENT_TYPES.filter((k) => (all || []).some((m) => m.content_types?.includes(k.key))).map((k) => <Chip key={k.key} on={content === k.key} onPress={() => setContent(content === k.key ? 'all' : k.key)}>{t(k.ar, k.en)}</Chip>)}
        </ScrollView>
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {all === null ? (
        <View>
          {header}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ width: col, aspectRatio: 3 / 4 }} />)}
          </View>
        </View>
      ) : (
        <FlatList
          key={view}
          data={filtered}
          keyExtractor={(m) => m.id}
          numColumns={view === 'grid' ? 2 : 1}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="never"
          columnWrapperStyle={view === 'grid' ? { gap: 12, paddingHorizontal: 20 } : undefined}
          contentContainerStyle={{ gap: view === 'grid' ? 12 : 0, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}
          renderItem={({ item }) => view === 'grid'
            ? <CastCard m={item} specialties={specialties} width={col} />
            : <View style={{ paddingHorizontal: 20 }}><MemberRow m={item} specialties={specialties} /></View>}
          ListEmptyComponent={<View style={{ paddingHorizontal: 20 }}><Empty title={t('لا نتائج', 'No results')} body={t('جرّب كلمة أخرى أو امسح الفلاتر.', 'Try another word or clear the filters.')} action={t('امسح الفلاتر', 'Clear filters')} onAction={() => { clear(); setSearch('') }} /></View>}
        />
      )}

      <Sheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title={t('الفلاتر', 'Filters')}
        footer={<View style={{ flexDirection: 'row', gap: 10 }}><Btn style={{ flex: 1 }} onPress={() => setFiltersOpen(false)}>{t(`اعرض ${filtered.length}`, `Show ${filtered.length}`)}</Btn><Btn variant="outline" onPress={clear}>{t('مسح', 'Clear')}</Btn></View>}>
        <Txt size={13} weight="semi" color={c.text2}>{t('الترتيب', 'Sort')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {([['default', t('المقترح', 'Suggested')], ['newest', t('الأحدث', 'Newest')], ['audience', t('الأكبر جمهوراً', 'Biggest audience')]] as [Sort, string][]).map(([k, l]) => <Chip key={k} on={sort === k} onPress={() => setSort(k)}>{l}</Chip>)}
        </View>
        <Txt size={13} weight="semi" color={c.text2}>{t('الدولة', 'Country')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip on={country === 'all'} onPress={() => setCountry('all')}>{t('كل الدول', 'All countries')}</Chip>
          {(usedCountries.length ? usedCountries : COUNTRIES).map((x) => <Chip key={x.ar} on={country === x.ar} onPress={() => setCountry(x.ar)}>{t(x.ar, x.en)}</Chip>)}
        </View>
        {type !== 'creator' ? (
          <>
            <Txt size={13} weight="semi" color={c.text2}>{t('التخصص', 'Role')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip on={specialty === 'all'} onPress={() => setSpecialty('all')}>{t('كل التخصصات', 'All roles')}</Chip>
              {specialties.map((s) => <Chip key={s.id} on={specialty === s.id} onPress={() => setSpecialty(s.id)}>{specName(specialties, s.id)}</Chip>)}
            </View>
          </>
        ) : (
          <>
            <Txt size={13} weight="semi" color={c.text2}>{t('نوع المحتوى', 'Content')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip on={content === 'all'} onPress={() => setContent('all')}>{t('الكل', 'All')}</Chip>
              {CONTENT_TYPES.map((k) => <Chip key={k.key} on={content === k.key} onPress={() => setContent(k.key)}>{t(k.ar, k.en)}</Chip>)}
            </View>
          </>
        )}
      </Sheet>
    </View>
  )
}
