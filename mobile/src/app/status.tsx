import { useCallback } from 'react'
import { Linking, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { t, useLang } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { SITE_URL } from '@/lib/constants'
import { shareLink } from '@/lib/share'
import { useToast } from '@/lib/toast'
import { Btn, Card, Header, Icon, Pill, Screen, Spinner, Txt } from '@/components/ui'

export default function Status() {
  useLang()
  const { c } = useTheme()
  const { profile, loading, refreshProfile } = useAuth()
  const toast = useToast()
  useFocusEffect(useCallback(() => { refreshProfile() }, [])) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !profile) return <Screen header={<Header />}><Spinner /></Screen>

  const link = `${SITE_URL}/${profile.username}`
  const share = async () => {
    const r = await shareLink(link, t('صفحتي على Makers', 'My page on Makers'))
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
  }
  const shareText = encodeURIComponent(t(`صفحتي على Makers: ${link}`, `My page on Makers: ${link}`))

  return (
    <Screen header={<Header title={t('حالة صفحتي', 'My page status')} />}>
      {profile.status === 'draft' && (
        <>
          <Pill tone="amber">{t('قيد الإكمال', 'In progress')}</Pill>
          <Txt display size={28}>{t('صفحتك لم تُرسل بعد', 'Your page is not sent yet')}</Txt>
          <Txt size={15} color={c.text2}>{t('أكمل الخطوات الخمس في صفحتك، ثم أرسلها لمراجعة الفريق.', 'Complete the five steps on your page, then send it to the team for review.')}</Txt>
          <Btn onPress={() => router.replace('/edit')}>{t('أكمل صفحتك', 'Complete your page')}</Btn>
        </>
      )}

      {profile.status === 'pending' && (
        <>
          <Pill tone="blue">{t('قيد المراجعة', 'In review')}</Pill>
          <Txt display size={28}>{t('وصلت صفحتك إلى فريق Makers', 'Your page reached the Makers team')}</Txt>
          <Txt size={15} color={c.text2}>{t('نراجع كل صفحة بعناية حتى يبقى الدليل موثوقاً. سنرسل لك رسالة وإشعاراً فور صدور القرار.', 'We review every page carefully so the directory stays trustworthy. We will send you an email and a notification as soon as there is a decision.')}</Txt>
          <Card>
            <Step state="done" title={t('أرسلت صفحتك', 'You sent your page')} />
            <Step state="current" title={t('مراجعة الفريق', 'Team review')} sub={t('نراجع الصفحات حسب ترتيب وصولها', 'Pages are reviewed in the order they arrive')} />
            <Step state="todo" title={t('نشر صفحتك في الدليل', 'Your page goes live in the directory')} />
          </Card>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn variant="soft" onPress={() => profile.username && router.push(`/maker/${profile.username}`)}>{t('معاينة صفحتي', 'Preview my page')}</Btn>
            <Btn variant="ghost" onPress={() => router.push('/edit')}><Txt size={15} weight="semi" color={c.accent}>{t('تعديل الصفحة', 'Edit page')}</Txt></Btn>
          </View>
        </>
      )}

      {profile.status === 'approved' && (
        <>
          <Pill tone="green">{t('منشورة', 'Live')}</Pill>
          <Txt display size={28}>{t('أهلاً بك في Makers، صفحتك منشورة', 'Welcome to Makers, your page is live')}</Txt>
          <Txt size={15} color={c.text2}>{profile.is_founding ? t('أنت الآن من الأعضاء المؤسسين. ', 'You are now a founding member. ') : ''}{t('شارك رابط صفحتك في حساباتك حتى يصل إليك أصحاب المشاريع.', 'Share your link on your accounts so clients can find you.')}</Txt>
          <Card>
            <Txt size={13} weight="semi" color={c.text2}>{t('رابط صفحتك', 'Your page link')}</Txt>
            <View style={{ height: 48, borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center', backgroundColor: c.surfaceAlt }}>
              <Txt mono size={14} style={{ textAlign: 'left' }} selectable>{link.replace('https://', '')}</Txt>
            </View>
            <Btn full icon="share" onPress={share}>{t('شارك الرابط', 'Share link')}</Btn>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Btn small variant="outline" onPress={() => Linking.openURL(`https://wa.me/?text=${shareText}`)}>{t('واتساب', 'WhatsApp')}</Btn>
              <Btn small variant="outline" onPress={() => Linking.openURL(`https://x.com/intent/tweet?text=${shareText}`)}>X</Btn>
              <Btn small variant="outline" onPress={() => Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`)}>{t('لينكدإن', 'LinkedIn')}</Btn>
            </View>
            <Txt size={12} color={c.muted}>{t('لإنستغرام وتيك توك: الصق الرابط في خانة الرابط داخل البايو.', 'For Instagram and TikTok: paste the link in your bio link field.')}</Txt>
          </Card>
          <Btn variant="soft" onPress={() => router.push(`/maker/${profile.username}`)}>{t('افتح صفحتي', 'Open my page')}</Btn>
        </>
      )}

      {profile.status === 'rejected' && (
        <>
          <Pill tone="red">{t('تحتاج تعديلاً', 'Needs changes')}</Pill>
          <Txt display size={28}>{t('لم تُقبل صفحتك هذه المرة', 'Your page was not approved this time')}</Txt>
          <Txt size={15} color={c.text2}>{t('هذا ليس رفضاً نهائياً. عدّل صفحتك حسب ملاحظة الفريق وأرسلها مرة أخرى.', 'This is not final. Update your page based on the team note and send it again.')}</Txt>
          {profile.review_note ? (
            <View style={{ padding: 18, borderRadius: 18, backgroundColor: 'rgba(248,113,113,0.12)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.35)', gap: 6 }}>
              <Txt size={13} weight="semi" color={c.danger}>{t('ملاحظة فريق Makers', 'Note from the Makers team')}</Txt>
              <Txt size={15} auto>{profile.review_note}</Txt>
            </View>
          ) : null}
          <Btn onPress={() => router.push('/edit')}>{t('عدّل صفحتك', 'Edit your page')}</Btn>
        </>
      )}

      {profile.status === 'suspended' && (
        <>
          <Pill>{t('موقوف', 'Suspended')}</Pill>
          <Txt display size={28}>{t('حسابك موقوف مؤقتاً', 'Your account is temporarily suspended')}</Txt>
          <Txt size={15} color={c.text2}>{t('تواصل مع فريق Makers إن كنت تعتقد أن هذا خطأ.', 'Contact the Makers team if you think this is a mistake.')}</Txt>
        </>
      )}
    </Screen>
  )
}

function Step({ state, title, sub }: { state: 'done' | 'current' | 'todo'; title: string; sub?: string }) {
  const { c } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {state === 'done' && <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={14} color={c.onAccent} weight="bold" /></View>}
      {state === 'current' && <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent }} /></View>}
      {state === 'todo' && <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: c.border }} />}
      <View style={{ flex: 1 }}>
        <Txt size={15} weight={state === 'todo' ? 'regular' : 'semi'} color={state === 'todo' ? c.muted : c.text}>{title}</Txt>
        {sub ? <Txt size={13} color={c.muted}>{sub}</Txt> : null}
      </View>
    </View>
  )
}
