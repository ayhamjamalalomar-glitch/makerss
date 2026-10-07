import { useEffect, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { t, useLang } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { displayName } from '../lib/data'
import { formatDateAr, SITE_URL } from '../lib/constants'
import { shareLink } from '../lib/share'
import { useToast } from '../lib/toast'
import ReportButton from '../components/ReportButton'
import { Avatar, Btn, Modal, Notice, PageShell, Skeleton } from '../components/mk'
import { ArticleBody, WritingCover, writingStatusLabel } from '../components/writing'
import { deleteWriting, excerpt, getWriting, readingMinutes, writingFileUrl, writingKindLabel, type Writing } from '../lib/writings'

export default function WritingPage({ id }: { id: string }) {
  useLang()
  const { profile, loading: authLoading } = useAuth()
  const { go } = useRouter()
  const toast = useToast()
  const [w, setW] = useState<Writing | null | undefined>(undefined)
  const [fileUrl, setFileUrl] = useState<string | null | undefined>(undefined)
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setW(undefined)
    getWriting(id).then((x) => {
      setW(x)
      if (x) document.title = `${x.title} | Makers`
    })
    return () => { document.title = 'Makers · دليل صنّاع الإنتاج العرب' }
  }, [id])

  const isOwner = !!w && !!profile && profile.id === w.owner_id
  const member = profile?.status === 'approved'
  const staff = profile?.role === 'admin' || profile?.role === 'reviewer'
  const gated = !!w && w.kind !== 'article' && w.visibility === 'members' && !member && !isOwner && !staff

  // The PDF link is signed per visit; storage rules decide who can open it.
  useEffect(() => {
    if (!w || w.kind === 'article' || !w.file_path || authLoading) return
    if (gated) { setFileUrl(null); return }
    setFileUrl(undefined)
    writingFileUrl(w.file_path).then(setFileUrl)
  }, [w, gated, authLoading])

  if (w === undefined) {
    return (
      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-8 py-10 flex flex-col gap-5">
        <Skeleton style={{ aspectRatio: '16/9' }} />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-40" />
      </div>
    )
  }
  if (!w) {
    return (
      <PageShell narrow>
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <span className="font-display font-bold text-2xl">{t('هذه الكتابة غير متاحة', 'This writing is not available')}</span>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('ربما حذفها كاتبها أو لم تُنشر بعد.', 'It may have been removed or is not published yet.')}</span>
          <Link to="/writing" className="text-sm font-semibold" style={{ color: 'var(--c-accent)' }}>{t('كل الكتابات', 'All writing')}</Link>
        </div>
      </PageShell>
    )
  }

  const url = `${SITE_URL}/writing/${w.id}`
  const share = async () => {
    const r = await shareLink(url, w.title)
    if (r === 'copied') toast(t('تم نسخ الرابط', 'Link copied'))
  }
  const remove = async () => {
    setBusy(true)
    try {
      await deleteWriting(w.id)
      toast(t('حُذفت الكتابة', 'Writing deleted'))
      go(profile?.username ? `/${profile.username}` : '/writing')
    } catch {
      setBusy(false)
      toast(t('تعذّر الحذف', 'Could not delete'), 'error')
    }
  }

  const author = w.owner
  const meta = [writingKindLabel(w.kind), formatDateAr(w.published_at || w.created_at), w.kind === 'article' ? t(`${readingMinutes(w.body)} دقائق قراءة`, `${readingMinutes(w.body)} min read`) : ''].filter(Boolean).join(' · ')

  return (
    <article className="flex flex-col">
      <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 pt-6 sm:pt-8">
        <WritingCover w={w} ratio="16/7" wide className="hidden md:block rounded-2xl" style={{ border: '1px solid var(--c-border)' }} />
        <WritingCover w={w} ratio="1/1" className="md:hidden rounded-2xl" style={{ border: '1px solid var(--c-border)' }} />
      </div>

      <div className="max-w-[760px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-7">
        {(isOwner || staff) && w.status !== 'published' && (
          <Notice tone={w.status === 'rejected' ? 'error' : 'info'}>
            <strong>{writingStatusLabel(w.status)}.</strong>{' '}
            {w.status === 'pending' && t('يراجعها فريق Makers وتُنشر بعد الموافقة. يصلك إشعار عند النشر.', 'The Makers team will review it before it goes live. You will be notified.')}
            {w.status === 'rejected' && (w.review_note ? <span dir="auto" className="whitespace-pre-line">{w.review_note}</span> : t('عدّلها وأرسلها من جديد.', 'Edit it and send it again.'))}
            {w.status === 'hidden' && t('أخفاها فريق Makers بعد بلاغ أو مراجعة.', 'The Makers team hid it after a report or review.')}
          </Notice>
        )}

        <header className="flex flex-col gap-4">
          <span className="text-[13px]" style={{ color: 'var(--c-accent)' }}>{meta}</span>
          <h1 dir="auto" className="font-display m-0" style={{ fontSize: 'clamp(28px, 4.4vw, 44px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }}>{w.title}</h1>
          {w.summary && <p dir="auto" className="m-0" style={{ fontSize: 18, lineHeight: 1.9, color: 'var(--c-muted)' }}>{w.summary}</p>}
          {author && (
            <Link to={`/${author.username}`} className="flex items-center gap-3 self-start group">
              <Avatar url={author.avatar_url} name={author.full_name} size={42} />
              <span className="flex flex-col">
                <span className="text-sm font-bold group-hover:opacity-80">{displayName(author)}</span>
                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('صفحة الكاتب', 'Writer\'s page')}</span>
              </span>
            </Link>
          )}
        </header>

        <div style={{ height: 1, background: 'var(--c-border)' }} />

        {w.kind === 'article' ? (
          <ArticleBody body={w.body || ''} />
        ) : (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--c-live)' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {t('عمل منجز يشاركه كاتبه', 'A finished work, shared by its writer')}
            </div>
            {gated ? (
              <div className="rounded-2xl p-7 flex flex-col gap-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <span className="font-display font-bold text-lg">{t('الملف متاح لأعضاء Makers فقط', 'The file is for Makers members only')}</span>
                <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('اختار الكاتب أن يقرأ عمله أعضاء Makers الموثّقون فقط.', 'The writer chose to share this work with reviewed Makers members only.')}</span>
                {!profile && <Link to={`/login?next=/writing/${w.id}`} className="self-start text-sm font-semibold" style={{ color: 'var(--c-accent)' }}>{t('سجّل الدخول', 'Sign in')}</Link>}
              </div>
            ) : fileUrl === undefined ? (
              <Skeleton style={{ height: 520 }} />
            ) : fileUrl === null ? (
              <Notice tone="error">{t('تعذّر فتح الملف الآن. حاول لاحقاً.', 'Could not open the file right now. Try later.')}</Notice>
            ) : (
              <>
                <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
                  <iframe src={`${fileUrl}#toolbar=1&view=FitH`} title={w.title} className="w-full block" style={{ height: '78vh', border: 'none' }} />
                </div>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full text-sm" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>
                  {t('افتح الملف', 'Open the file')}
                  <span className="font-mono text-[11px] opacity-70" dir="ltr">PDF</span>
                </a>
              </>
            )}
            <p className="m-0 text-xs leading-relaxed" style={{ color: 'var(--c-muted-2)' }}>
              {t('هذا العمل ملك كاتبه. لا يجوز نسخه أو تصويره أو استخدامه كلياً أو جزئياً بدون إذن مكتوب منه.', 'This work belongs to its writer. It may not be copied, filmed or used in whole or in part without their written permission.')}
            </p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-6" style={{ borderTop: '1px solid var(--c-border)' }}>
          <Btn variant="soft" className="!py-2.5 !px-5" onClick={share}>{t('شارك', 'Share')}</Btn>
          {isOwner && w.status !== 'hidden' && <Btn variant="outline" className="!py-2.5 !px-5" onClick={() => go(`/writing/${w.id}/edit`)}>{t('عدّل', 'Edit')}</Btn>}
          {isOwner && <Btn variant="danger" className="!py-2.5 !px-5" onClick={() => setConfirmDel(true)}>{t('احذف', 'Delete')}</Btn>}
          <span className="flex-1" />
          {!isOwner && w.status === 'published' && <ReportButton type="writing" id={w.id} />}
        </div>

        {author && w.kind === 'article' && excerpt(w).length > 0 && (
          <Link to={`/${author.username}?tab=writing`} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <Avatar url={author.avatar_url} name={author.full_name} size={52} />
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('كتبها', 'Written by')}</span>
              <span className="font-bold truncate">{displayName(author)}</span>
            </span>
            <span className="ms-auto text-xs font-semibold" style={{ color: 'var(--c-accent)' }}>{t('كل كتاباته', 'All their writing')}</span>
          </Link>
        )}
      </div>

      {confirmDel && (
        <Modal title={t('حذف الكتابة؟', 'Delete this writing?')} onClose={() => setConfirmDel(false)} footer={<><Btn variant="danger" disabled={busy} onClick={remove}>{busy ? t('جارٍ الحذف…', 'Deleting…') : t('احذف نهائياً', 'Delete for good')}</Btn><Btn variant="outline" onClick={() => setConfirmDel(false)}>{t('إلغاء', 'Cancel')}</Btn></>}>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('تُحذف الكتابة وملفها ولا يمكن استرجاعها.', 'The writing and its file are removed and cannot be restored.')}</span>
        </Modal>
      )}
    </article>
  )
}
