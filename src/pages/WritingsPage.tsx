import { useEffect, useState } from 'react'
import Link from '../lib/router'
import { t, useLang } from '../lib/i18n'
import { PageHeader } from '../components/cine'
import { Chip, Skeleton } from '../components/mk'
import { WritingCard } from '../components/writing'
import { useIsWriter, listWritings, WRITING_KINDS, type Writing, type WritingKind } from '../lib/writings'

export default function WritingsPage() {
  useLang()
  const [kind, setKind] = useState<WritingKind | null>(() => {
    const k = new URLSearchParams(window.location.search).get('kind')
    return WRITING_KINDS.some((x) => x.key === k) ? (k as WritingKind) : null
  })
  const [list, setList] = useState<Writing[] | null>(null)

  useEffect(() => {
    document.title = `${t('كتابات', 'Writing')} | Makers`
    return () => { document.title = 'Makers · دليل صنّاع الإنتاج العرب' }
  }, [])

  useEffect(() => {
    setList(null)
    const url = new URL(window.location.href)
    if (kind) url.searchParams.set('kind', kind)
    else url.searchParams.delete('kind')
    window.history.replaceState(null, '', url.pathname + url.search)
    listWritings({ kind: kind || undefined, limit: 120 }).then(setList).catch(() => setList([]))
  }, [kind])

  const writer = useIsWriter()

  return (
    <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-7">
      <PageHeader
        title={t('كتابات', 'Writing')}
        sub={t('مقالات يكتبها صنّاع Makers، وسيناريوهات وستوري بورد منجزة يشاركها كتّابها.', 'Articles by Makers members, and finished scripts and storyboards shared by their writers.')}
        action={writer ? <Link to="/writing/new" className="inline-flex font-semibold px-6 py-3 rounded-full text-sm" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)' }}>{t('اكتب', 'Write')}</Link> : undefined}
      />

      <div className="flex gap-2 flex-wrap">
        <Chip on={!kind} onClick={() => setKind(null)}>{t('الكل', 'All')}</Chip>
        {WRITING_KINDS.map((k) => <Chip key={k.key} on={kind === k.key} onClick={() => setKind(k.key)}>{t(k.key === 'article' ? 'مقالات' : k.ar, k.key === 'article' ? 'Articles' : k.en + 's')}</Chip>)}
      </div>

      {list === null ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} style={{ aspectRatio: '4/5' }} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl p-8 md:p-10 flex flex-col gap-2" style={{ background: 'var(--c-surface)', border: '1px dashed var(--c-border-mid)' }}>
          <span className="font-display font-bold text-lg">{t('لا توجد كتابات منشورة هنا بعد.', 'Nothing published here yet.')}</span>
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>
            {writer
              ? t('كن أول من يكتب. مقال قصير عن تجربة في موقع تصوير يكفي للبداية.', 'Be the first. A short piece about a day on set is a good start.')
              : t('الكتابة متاحة لأعضاء Makers من كتّاب المحتوى والسيناريو ورسامي الستوري بورد.', 'Writing is open to Makers members who are content writers, screenwriters or storyboard artists.')}
          </span>
        </div>
      ) : (
        <div className="grid gap-x-5 gap-y-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.map((w) => <WritingCard key={w.id} w={w} />)}
        </div>
      )}
    </div>
  )
}
