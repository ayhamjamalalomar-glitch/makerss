import * as WebBrowser from 'expo-web-browser'
import { View } from 'react-native'
import { Btn, CallCard, Empty, Loading, PageTitle, Screen, Txt } from '../../components/ui'
import { SITE_URL } from '../../lib/constants'
import { listOpenCalls, useLoad } from '../../lib/data'
import { t } from '../../lib/i18n'
import { C, PAD, R } from '../../lib/theme'

export default function Opportunities() {
  const calls = useLoad(() => listOpenCalls(50))
  return (
    <Screen refreshing={false} onRefresh={calls.reload}>
      <PageTitle label="SC.04 / CASTING CALL" title={t('فرص مفتوحة', 'Open calls')} subtitle={t('إنتاجات تبحث عن طاقم الآن. قدّم وانضم إلى التصوير.', 'Productions looking for crew right now. Apply and join the shoot.')} />
      {calls.loading ? <Loading /> : calls.data?.length ? (
        <View style={{ gap: 12 }}>{calls.data.map((c) => <CallCard key={c.id} c={c} />)}</View>
      ) : <Empty text={t('لا توجد فرص مفتوحة حالياً. عُد قريباً.', 'No open calls right now. Check back soon.')} />}

      <View style={{ marginHorizontal: PAD, marginTop: 28, padding: 20, borderRadius: R.xl, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, gap: 12 }}>
        <Txt v="display" size={17}>{t('عندك مشروع يحتاج طاقم؟', 'Have a project to crew up?')}</Txt>
        <Txt size={14} color={C.text2}>{t('انشر فرصتك من الموقع وتواصل مع صنّاع موثّقين.', 'Post your call on the website and reach reviewed makers.')}</Txt>
        <Btn label={t('انشر فرصة', 'Post a call')} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/opportunities/new`)} style={{ alignSelf: 'flex-start' }} />
      </View>
    </Screen>
  )
}
