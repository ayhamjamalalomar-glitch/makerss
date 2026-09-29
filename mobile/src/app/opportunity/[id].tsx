import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Pressable, ScrollView, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Btn, Empty, Loading, Tag, Txt, tap } from '../../components/ui'
import { budgetLabel, formatDate, relative, SITE_URL } from '../../lib/constants'
import { displayName, getOpenCall, kindLabel, specName, useLoad, useSpecialties } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, PAD, R } from '../../lib/theme'

export default function OpportunityPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const specs = useSpecialties()
  const res = useLoad(() => getOpenCall(String(id)), [id])
  const c = res.data

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: PAD, paddingBottom: insets.bottom + 40, gap: 16 }}>
      {res.loading ? <Loading /> : !c ? <Empty text={t('هذه الفرصة غير متاحة.', 'This call is not available.')} /> : (
        <>
          <View style={{ gap: 8 }}>
            {!!c.kind && <Tag label={kindLabel(c.kind)} />}
            <Txt v="heavy" size={26}>{c.title}</Txt>
            {!!c.org && <Txt size={14} color={C.muted}>{c.org}</Txt>}
          </View>

          <View style={{ flexDirection: 'row', borderRadius: R.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}>
            {([
              [t('الميزانية', 'Budget'), budgetLabel(c.budget)],
              [t('المكان', 'Location'), c.remote ? t('عن بُعد', 'Remote') : [c.city, c.country].filter(Boolean).join(t('، ', ', ')) || '·'],
              [t('آخر موعد', 'Deadline'), c.deadline ? formatDate(c.deadline) : '·'],
            ] as [string, string][]).map(([k, v], i) => (
              <View key={k} style={{ flex: 1, padding: 12, borderStartWidth: i ? 1 : 0, borderColor: C.border }}>
                <Txt size={10} color={C.muted}>{k}</Txt>
                <Txt v="bold" size={13}>{v}</Txt>
              </View>
            ))}
          </View>

          <Txt size={15} color={C.text2}>{c.description}</Txt>

          {!!c.role_ids?.length && (
            <View style={{ gap: 8 }}>
              <Txt v="bold" size={14}>{t('الأدوار المطلوبة', 'Roles needed')}</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {c.role_ids.map((rid) => (
                  <View key={rid} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.sm, borderWidth: 1, borderColor: 'rgba(242,179,61,0.45)', backgroundColor: 'rgba(242,179,61,0.1)' }}>
                    <Txt v="bold" size={13} color={C.accent}>{specName(specs, rid)}</Txt>
                  </View>
                ))}
              </View>
            </View>
          )}

          {c.owner && (
            <Pressable onPress={() => { tap(); router.push(`/maker/${c.owner!.username}`) }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
              <Avatar uri={c.owner.avatar_url} name={displayName(c.owner)} size={40} />
              <View style={{ flex: 1 }}>
                <Txt v="bold" size={14}>{displayName(c.owner)}</Txt>
                <Txt size={12} color={C.muted}>{t('نشر الفرصة', 'Posted this call')} · {relative(c.created_at)}</Txt>
              </View>
            </Pressable>
          )}

          <Btn label={t('قدّم على الفرصة', 'Apply')} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/opportunities/${c.id}`)} />
          <Btn label={t('شارك الفرصة', 'Share')} kind="ghost" onPress={() => Share.share({ message: `${c.title} | Makers\n${SITE_URL}/opportunities/${c.id}`, url: `${SITE_URL}/opportunities/${c.id}` }).catch(() => {})} />
        </>
      )}
    </ScrollView>
  )
}
