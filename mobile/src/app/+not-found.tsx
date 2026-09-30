import { router } from 'expo-router'
import { t } from '@/lib/i18n'
import { Empty, Header, Screen } from '@/components/ui'

export default function NotFound() {
  return (
    <Screen header={<Header />}>
      <Empty title={t('الصفحة غير موجودة', 'Page not found')} action={t('الرئيسية', 'Home')} onAction={() => router.replace('/')} />
    </Screen>
  )
}
