import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { t, useLang } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { displayName } from '../lib/data'
import { formatDateAr } from '../lib/constants'
import { Avatar, Chip, Notice, Spinner } from '../components/mk'
import { ArticleBlocks, renderShareImage, WritingCover } from '../components/writing'
import BlockEditor, { AutoText, ELEMENTS, ElementIcon, type ActiveBlock, type BlockEditorApi } from '../components/BlockEditor'
import {
  blocksFromBody, blocksText, cleanBlocks, getWriting, listWritings, myWriterStatus, newBlock, removeWritingFile, saveWriting,
  setWritingCover, uploadWritingMedia, uploadWritingPdf, writingError, writingPath,
  WRITING_KINDS, WRITING_LIMITS, type Block, type BlockType, type Writing, type WriterStatus, type WritingKind,
} from '../lib/writings'

// The writing editor: a page of its own, like a blank sheet. Title, standfirst and author first,
// then the article built from blocks (text, headings, lists, quote, image, video, podcast, button).
// Scripts and storyboards upload a finished PDF instead.

const box = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' } as const

export default function WritingEditor({ id }: { id?: string }) {
  useLang()
  const { go } = useRouter()
  const toast = useToast()
  const { session, profile, loading } = useAuth()
  const [status, setStatus] = useState<WriterStatus | null>(null)
  const [existing, setExisting] = useState<Writing | null | undefined>(id ? undefined : null)
  const [first, setFirst] = useState(false)

  const [kind, setKind] = useState<WritingKind>('article')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [blocks, setBlocks] = useState<Block[]>(() => [newBlock('p')])
  const [file, setFile] = useState<File | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<'public' | 'members'>('public')
  const [completed, setCompleted] = useState(false)
  const [preview, setPreview] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const api = useRef<BlockEditorApi | null>(null)
  const [active, setActive] = useState<ActiveBlock>(null)

  useEffect(() => { if (session) myWriterStatus().then(setStatus) }, [session])
  useEffect(() => {
    if (id || !profile) return
    listWritings({ owner: profile.id, all: true, limit: 1 }).then((l) => setFirst(l.length === 0)).catch(() => null)
  }, [id, profile])

  useEffect(() => {
    if (!id) return
    getWriting(id).then((w) => {
      setExisting(w)
      if (!w) return
      setKind(w.kind); setTitle(w.title); setSummary(w.summary || '')
      setBlocks(Array.isArray(w.blocks) && w.blocks.length ? (w.blocks as Block[]).map((b) => ({ ...b, id: Math.random().toString(36).slice(2, 10) })) : w.body ? blocksFromBody(w.body) : [newBlock('p')])
      setFilePath(w.file_path); setFileName(w.file_name); setVisibility(w.visibility); setCompleted(w.completed)
    })
  }, [id])

  // Leaving with unsent work asks first.
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  useEffect(() => {
    document.title = `${t('اكتب', 'Write')} | Makers`
    return () => { document.title = 'Makers · دليل صنّاع الإنتاج العرب' }
  }, [])

  const edit = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setDirty(true) }

  if (loading || (session && !status) || existing === undefined) return <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}><Spinner /></div>
  if (!session || !profile) {
    return <Shell><div className="max-w-[640px] mx-auto px-4 py-16"><Notice>{t('سجّل الدخول لتكتب على Makers.', 'Sign in to write on Makers.')} <Link to={`/login?next=${id ? `/writing/${id}/edit` : '/writing/new'}`} className="font-semibold underline">{t('دخول', 'Sign in')}</Link></Notice></div></Shell>
  }
  if (!status?.writer) {
    return (
      <Shell>
        <div className="max-w-[640px] mx-auto px-4 py-16">
          <Notice>
            {profile.status !== 'approved'
              ? t('تفتح الكتابة بعد موافقة فريق Makers على صفحتك.', 'Writing opens once the Makers team approves your page.')
              : t('النشر في الكتابات لأصحاب تخصصات الكتابة: كاتب محتوى، كاتب سيناريو، رسام ستوري بورد. إن كان هذا تخصصك أضفه إلى صفحتك.', 'Writing is for members with a writing specialty: content writer, screenwriter, storyboard artist. If that is you, add it to your page.')}
            {' '}{profile.status === 'approved' && <Link to="/me" className="font-semibold underline">{t('عدّل صفحتك', 'Edit your page')}</Link>}
          </Notice>
        </div>
      </Shell>
    )
  }
  if (id && (!existing || existing.owner_id !== profile.id)) return <Shell><div className="max-w-[640px] mx-auto px-4 py-16"><Notice tone="error">{t('لا يمكنك تعديل هذه الكتابة.', 'You cannot edit this writing.')}</Notice></div></Shell>
  if (existing?.status === 'hidden') return <Shell><div className="max-w-[640px] mx-auto px-4 py-16"><Notice tone="error">{t('أخفى فريق Makers هذه الكتابة، ولا يمكن تعديلها.', 'The Makers team hid this writing. It cannot be edited.')}</Notice></div></Shell>

  const isArticle = kind === 'article'
  const kindWord = WRITING_KINDS.find((k) => k.key === kind)!
  const heading = id
    ? t(`تعديل ${kindWord.ar}`, `Edit ${kindWord.en.toLowerCase()}`)
    : isArticle
      ? first ? t('اكتب مقالك الأول', 'Write your first article') : t('مقال جديد', 'New article')
      : kind === 'script' ? t('سيناريو جديد', 'New script') : t('ستوري بورد جديد', 'New storyboard')
  const textLen = blocksText(blocks).length
  const author = displayName(profile)
  const leave = () => {
    if (dirty && !window.confirm(t('لم تُنشر هذه الكتابة بعد. تخرج وتتركها؟', 'This is not published yet. Leave anyway?'))) return
    go(id && existing ? writingPath(existing) : '/writing')
  }
  const insert = (type: BlockType) => { setPreview(false); setSheet(false); api.current?.insert(type); setDirty(true) }

  const pickFile = (f: File | null | undefined) => {
    setError(null)
    if (!f) return
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) return setError(t('الملف يجب أن يكون PDF.', 'The file must be a PDF.'))
    if (f.size > WRITING_LIMITS.pdfBytes) return setError(t('حجم الملف أكبر من 20 ميغابايت.', 'The file is larger than 20 MB.'))
    setFile(f)
    setDirty(true)
  }

  const submit = async () => {
    setError(null)
    const tt = title.trim()
    if (tt.length < 3) return setError(t('اكتب عنواناً من 3 أحرف على الأقل.', 'Write a title of at least 3 characters.'))
    if (isArticle && textLen < WRITING_LIMITS.bodyMin) return setError(t(`المقال يحتاج ${WRITING_LIMITS.bodyMin} حرفاً على الأقل. كتبت ${textLen}.`, `An article needs at least ${WRITING_LIMITS.bodyMin} characters. You have ${textLen}.`))
    if (!isArticle && !file && !filePath) return setError(t('ارفع ملف PDF للعمل.', 'Upload the PDF of the work.'))
    if (!isArticle && !completed) return setError(t('أكّد أن العمل منجز ومكتمل. لا ننشر الأعمال غير المكتملة.', 'Confirm the work is finished. We do not publish unfinished work.'))

    setBusy(true)
    let uploaded: string | null = null
    try {
      if (!isArticle && file) uploaded = await uploadWritingPdf(profile.id, file)
      const path = isArticle ? null : uploaded || filePath
      const name = isArticle ? null : file ? file.name.slice(0, 200) : fileName
      const clean = isArticle ? cleanBlocks(blocks) : null
      const newId = await saveWriting(id || null, {
        kind, title: tt, summary: summary.trim(), body: isArticle ? blocksText(blocks) : '', blocks: clean,
        file_path: path, file_name: name, visibility: isArticle ? 'public' : visibility, completed: !isArticle && completed,
      })
      if (filePath && filePath !== path) await removeWritingFile(filePath)
      // Share image for WhatsApp, X and the rest: the cover with the title, drawn here and stored with the writing.
      try {
        const png = await renderShareImage({ kind, title: tt, author })
        if (png) await setWritingCover(newId, await uploadWritingMedia(profile.id, png, 'png'))
      } catch { /* the reader page makes it on the author's next visit */ }
      setDirty(false)
      toast(status.trusted ? t('نُشرت كتابتك', 'Your writing is live') : t('وصلت كتابتك، ويصلك إشعار عند نشرها', 'Sent. You will be notified when it goes live'))
      const saved = await getWriting(newId)
      go(saved ? writingPath(saved) : `/writing/${newId}`)
    } catch (e) {
      if (uploaded) await removeWritingFile(uploaded)
      setBusy(false)
      setError(e instanceof Error && /storage|bucket|mime|size/i.test(e.message) ? t('تعذّر رفع الملف. تأكد أنه PDF أقل من 20 ميغابايت.', 'Could not upload the file. Make sure it is a PDF under 20 MB.') : writingError(e))
    }
  }

  return (
    <Shell>
      {/* top bar */}
      <div className="sticky top-0 z-30" style={{ background: 'var(--c-overlay)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 h-[60px] flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={leave} aria-label={t('خروج', 'Close')} className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0" style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>
            <ElementIcon size={16} d="M5 5l10 10M15 5L5 15" />
          </button>
          <span className="font-display font-bold text-[15px] truncate">{heading}</span>
          <div className="hidden sm:flex gap-1 p-1 rounded-full ms-2" style={{ background: 'var(--c-surface-alt)' }}>
            {WRITING_KINDS.map((k) => (
              <button key={k.key} type="button" onClick={() => { setKind(k.key); setDirty(true) }} className="text-[12.5px] px-3 py-1.5 rounded-full cursor-pointer" style={{ border: 'none', background: kind === k.key ? 'var(--c-accent)' : 'transparent', color: kind === k.key ? 'var(--c-on-accent)' : 'var(--c-muted)', fontWeight: kind === k.key ? 600 : 400 }}>
                {t(k.ar, k.en)}
              </button>
            ))}
          </div>
          <span className="flex-1" />
          {isArticle && (
            <button type="button" onClick={() => setPreview(!preview)} className="h-9 px-3.5 rounded-full text-[13px] cursor-pointer flex items-center gap-1.5" style={{ background: preview ? 'var(--c-surface-alt)' : 'transparent', border: '1px solid var(--c-border-mid)', color: 'var(--c-text)' }}>
              <ElementIcon size={15} d={preview ? 'M12.5 4.5l-7 7L4 16l4.5-1.5 7-7zM11 6l3 3' : 'M2.5 10s3-5.5 7.5-5.5S17.5 10 17.5 10s-3 5.5-7.5 5.5S2.5 10 2.5 10zM10 12.2a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4z'} />
              <span className="hidden sm:inline">{preview ? t('رجوع للكتابة', 'Back to writing') : t('معاينة', 'Preview')}</span>
            </button>
          )}
          <button type="button" disabled={busy} onClick={submit} className="h-9 px-5 rounded-full text-[13px] font-semibold cursor-pointer disabled:opacity-50" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', border: 'none' }}>
            {busy ? t('جارٍ النشر…', 'Publishing…') : id ? t('احفظ', 'Save') : t('انشر', 'Publish')}
          </button>
        </div>
        <div className="sm:hidden flex gap-1 px-3 pb-2 overflow-x-auto">
          {WRITING_KINDS.map((k) => <Chip key={k.key} on={kind === k.key} onClick={() => { setKind(k.key); setDirty(true) }} className="!py-1.5 !text-[12px]">{t(k.ar, k.en)}</Chip>)}
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex gap-10 items-start">
        {/* elements panel */}
        {isArticle && !preview && (
          <aside data-editor-tools className="hidden lg:flex flex-col gap-5 w-[220px] shrink-0 sticky top-[84px] py-8 max-h-[calc(100vh-84px)] overflow-y-auto no-scrollbar">
            <Elements onPick={insert} onBold={() => { api.current?.bold(); setDirty(true) }} api={api} active={active} onSize={(n) => { api.current?.setSize(n); setDirty(true) }} />
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: '1px solid var(--c-border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--c-muted)' }}>{t('الغلاف يُصنع من العنوان', 'The cover is made from the title')}</span>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
                <WritingCover w={{ kind, title: title.trim() || t('عنوان كتابتك', 'Your title'), owner: profile }} />
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0 max-w-[740px] mx-auto py-8 sm:py-12 pb-40 flex flex-col gap-8">
          {preview && isArticle ? (
            <>
              <WritingCover w={{ kind, title: title.trim() || t('عنوان كتابتك', 'Your title'), owner: profile }} ratio="16/9" wide className="rounded-2xl" style={{ border: '1px solid var(--c-border)' }} />
              {summary.trim() && <p dir="auto" className="m-0" style={{ fontSize: 20, lineHeight: 1.85, color: 'var(--c-text-2)' }}>{summary}</p>}
              <AuthorLine name={author} avatar={profile.avatar_url} fullName={profile.full_name} />
              <div style={{ height: 1, background: 'var(--c-border)' }} />
              <ArticleBlocks blocks={cleanBlocks(blocks).map((b, i) => ({ ...b, id: String(i) }) as Block)} />
            </>
          ) : (
            <>
              <header className="flex flex-col gap-4">
                <AutoText value={title} onChange={edit((v: string) => setTitle(v.replace(/\n/g, ' ')))} maxLength={WRITING_LIMITS.title} placeholder={isArticle ? t('عنوان المقال', 'Article title') : t('عنوان العمل', 'Title of the work')}
                  className="font-display" style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em' }} />
                <AutoText value={summary} onChange={edit(setSummary)} maxLength={WRITING_LIMITS.summary}
                  placeholder={isArticle ? t('سطر تعريفي يظهر تحت العنوان (اختياري)', 'A line under the title (optional)') : t('عن ماذا يدور العمل، نوعه ومدته، وهل أُنتج', 'What it is about, its format and length, and whether it was produced')}
                  style={{ fontSize: 20, lineHeight: 1.85, color: 'var(--c-text-2)' }} />
                <AuthorLine name={author} avatar={profile.avatar_url} fullName={profile.full_name} />
              </header>
              <div style={{ height: 1, background: 'var(--c-border)' }} />

              {isArticle ? (
                <BlockEditor blocks={blocks} onChange={edit(setBlocks)} uid={profile.id} apiRef={api} onActive={setActive} />
              ) : (
                <PdfSection file={file} fileName={fileName} onPick={pickFile} visibility={visibility} setVisibility={edit(setVisibility)} completed={completed} setCompleted={edit(setCompleted)} />
              )}
            </>
          )}

          {error && <Notice tone="error">{error}</Notice>}
          {isArticle && !preview && (
            <span className="font-mono text-[11px]" dir="ltr" style={{ color: textLen < WRITING_LIMITS.bodyMin ? 'var(--c-muted-2)' : 'var(--c-live)' }}>
              {textLen < WRITING_LIMITS.bodyMin ? `${textLen}/${WRITING_LIMITS.bodyMin}` : textLen.toLocaleString('en')}
            </span>
          )}
        </main>
      </div>

      {/* phones: elements open from a round button */}
      {isArticle && !preview && (
        <>
          <button type="button" data-editor-tools onMouseDown={(ev) => ev.preventDefault()} onClick={() => setSheet(true)} aria-label={t('أضف عنصراً', 'Add an element')} className="lg:hidden fixed bottom-6 end-5 z-40 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'var(--c-accent)', color: 'var(--c-on-accent)', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <ElementIcon size={22} d="M10 4v12M4 10h12" />
          </button>
          {sheet && (
            <div data-editor-tools className="lg:hidden fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSheet(false)}>
              <div className="w-full rounded-t-2xl p-5 pb-8 max-h-[75vh] overflow-y-auto" style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }} onClick={(e) => e.stopPropagation()}>
                <Elements onPick={insert} onBold={() => { setSheet(false); api.current?.bold(); setDirty(true) }} grid active={active} onSize={(n) => { api.current?.setSize(n); setDirty(true) }} />
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen" style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>{children}</div>
}

function AuthorLine({ name, avatar, fullName }: { name: string; avatar: string | null; fullName: string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar url={avatar} name={fullName} size={40} />
      <span className="flex flex-col">
        <span className="text-sm font-bold">{name}</span>
        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{formatDateAr(new Date().toISOString())}</span>
      </span>
    </div>
  )
}

function Elements({ onPick, onBold, grid, api, active, onSize }: { onPick: (t: BlockType) => void; onBold: () => void; grid?: boolean; api?: { current: BlockEditorApi | null }; active?: ActiveBlock; onSize?: (n: number) => void }) {
  // Drag an element from the panel into the article: a small card follows the pointer and a line shows where it lands.
  const dragged = useRef(false)
  const [ghost, setGhost] = useState<{ e: (typeof ELEMENTS)[number]; x: number; y: number; over: boolean } | null>(null)
  const startPanelDrag = (ev: React.PointerEvent<HTMLButtonElement>, e: (typeof ELEMENTS)[number]) => {
    if (ev.button !== 0 || !api) return
    const x0 = ev.clientX, y0 = ev.clientY
    dragged.current = false
    const move = (m: PointerEvent) => {
      if (!dragged.current && Math.hypot(m.clientX - x0, m.clientY - y0) > 5) { dragged.current = true; document.body.style.userSelect = 'none' }
      if (!dragged.current) return
      const over = api.current?.hover(m.clientX, m.clientY) ?? false
      setGhost({ e, x: m.clientX, y: m.clientY, over })
    }
    const up = (m: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      document.body.style.userSelect = ''
      if (dragged.current) api.current?.dropNew(e.type, m.clientX, m.clientY)
      setGhost(null)
      // the click that follows a drag must not add the element a second time
      setTimeout(() => { dragged.current = false }, 0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  const item = (e: (typeof ELEMENTS)[number]) => (
    <button key={e.type} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => { if (!dragged.current) onPick(e.type) }}
      onPointerDown={grid || !api ? undefined : (ev) => startPanelDrag(ev, e)}
      aria-pressed={active?.type === e.type}
      className={`flex items-center gap-3 rounded-lg text-start transition-colors hover:bg-white/5 ${grid ? 'cursor-pointer flex-col justify-center py-3 px-2 text-center' : 'cursor-grab active:cursor-grabbing px-2.5 py-2'}`}
      style={{ background: active?.type === e.type ? 'rgba(var(--c-accent-rgb),0.12)' : grid ? 'var(--c-surface-alt)' : 'none', border: 'none', color: active?.type === e.type ? 'var(--c-accent)' : 'var(--c-text)', fontSize: grid ? 12 : 13.5 }}>
      <span style={{ color: active?.type === e.type ? 'var(--c-accent)' : 'var(--c-muted)' }}><ElementIcon d={e.icon} /></span>
      {t(e.ar, e.en)}
    </button>
  )
  const label = (s: string) => <span className="text-[11px] px-2.5" style={{ color: 'var(--c-muted)', letterSpacing: '0.04em' }}>{s}</span>
  const wrap = grid ? 'grid grid-cols-3 gap-2' : 'flex flex-col'
  return (
    <div className="flex flex-col gap-4">
      {ghost && (
        <div className="fixed z-[80] pointer-events-none flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-[transform,opacity] duration-100"
          style={{ left: ghost.x, top: ghost.y, transform: `translate(-50%, -120%) scale(${ghost.over ? 1 : 0.94})`, opacity: ghost.over ? 1 : 0.75, background: 'var(--c-surface)', border: `1px solid ${ghost.over ? 'var(--c-accent)' : 'var(--c-border-mid)'}`, boxShadow: '0 14px 34px rgba(0,0,0,0.55)', color: 'var(--c-text)' }}>
          <span style={{ color: 'var(--c-accent)' }}><ElementIcon size={15} d={ghost.e.icon} /></span>
          {t(ghost.e.ar, ghost.e.en)}
        </div>
      )}
      {!grid && <span className="text-[11.5px] leading-relaxed px-2.5" style={{ color: 'var(--c-muted-2)' }}>{t('وأنت على سطر، اضغط نوعاً لتحويله (عنوان، اقتباس، قائمة). أو اسحب العنصر إلى المكان الذي تريده.', 'On a line, click a type to turn it into that (heading, quote, list). Or drag an element to where you want it.')}</span>}
      {onSize && <SizeControl active={active ?? null} onSize={onSize} />}
      <div className="flex flex-col gap-1.5">
        {label(t('أساسي', 'Basic'))}
        <div className={wrap}>
          {ELEMENTS.filter((e) => e.group === 'basic').map(item)}
          <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={onBold} className={`flex items-center gap-3 rounded-lg cursor-pointer text-start transition-colors hover:bg-white/5 ${grid ? 'flex-col justify-center py-3 px-2 text-center' : 'px-2.5 py-2'}`} style={{ background: grid ? 'var(--c-surface-alt)' : 'none', border: 'none', color: 'var(--c-text)', fontSize: grid ? 12 : 13.5 }}>
            <span className="w-[18px] text-center font-bold" style={{ color: 'var(--c-muted)' }}>B</span>
            {t('خط عريض', 'Bold')}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {label(t('وسائط', 'Media'))}
        <div className={wrap}>{ELEMENTS.filter((e) => e.group === 'media').map(item)}</div>
      </div>
    </div>
  )
}

function PdfSection({ file, fileName, onPick, visibility, setVisibility, completed, setCompleted }: {
  file: File | null; fileName: string | null; onPick: (f: File | null | undefined) => void
  visibility: 'public' | 'members'; setVisibility: (v: 'public' | 'members') => void; completed: boolean; setCompleted: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.35)' }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5" aria-hidden="true"><path d="M10 2.5l8 14H2l8-14z" stroke="#FF8A80" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 8v4M10 14.5v.5" stroke="#FF8A80" strokeWidth="1.6" strokeLinecap="round" /></svg>
        <div className="flex flex-col gap-1 text-[13px] leading-relaxed" style={{ color: '#FFB4AD' }}>
          <strong>{t('تنبيه: ننشر الأعمال المنجزة فقط', 'Notice: finished work only')}</strong>
          <span>{t('شارك السيناريو أو الستوري بورد بعد اكتماله فقط. لا ترفع فكرة قيد التطوير أو مشروعاً لم يُنتج بعد وتخشى عليه، فالملف المنشور يقرؤه غيرك. ارفع عملك أنت فقط، أو عملاً تملك إذن نشره.', 'Share a script or storyboard only once it is complete. Do not upload an idea in development or an unproduced project you want to protect: a published file is read by others. Upload only your own work, or work you have permission to publish.')}</span>
        </div>
      </div>

      <label className="rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer" style={{ background: 'var(--c-surface)', border: '1.5px dashed var(--c-border-mid)', minHeight: 150 }}
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]) }}>
        <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = '' }} />
        <span className="font-mono text-[11px] px-2 py-0.5 rounded" dir="ltr" style={{ border: '1px solid var(--c-border-mid)', color: 'var(--c-accent)' }}>PDF</span>
        {file || fileName ? (
          <>
            <span dir="auto" className="text-sm font-semibold break-all">{file?.name || fileName}</span>
            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ` : ''}{t('اضغط لتبديل الملف', 'Click to replace')}</span>
          </>
        ) : (
          <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('اسحب الملف هنا أو اضغط لاختياره، حتى 20 ميغابايت', 'Drop the file here or click to choose, up to 20 MB')}</span>
        )}
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{t('من يقرأ الملف', 'Who can read the file')}</span>
        <div className="flex gap-2 flex-wrap">
          <Chip on={visibility === 'public'} onClick={() => setVisibility('public')}>{t('الجميع', 'Everyone')}</Chip>
          <Chip on={visibility === 'members'} onClick={() => setVisibility('members')}>{t('أعضاء Makers فقط', 'Makers members only')}</Chip>
        </div>
      </div>

      <label className="flex gap-3 items-start rounded-xl p-4 cursor-pointer" style={{ ...box, borderColor: completed ? 'var(--c-accent)' : 'var(--c-border)' }}>
        <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="mt-1 w-4 h-4 shrink-0" style={{ accentColor: 'var(--c-accent)' }} />
        <span className="text-[13.5px] leading-relaxed">{t('أؤكد أن هذا العمل منجز ومكتمل، وأنه من كتابتي أو أملك حق نشره، وأتحمّل مسؤولية مشاركته.', 'I confirm this work is finished and complete, that I wrote it or have the right to publish it, and that I am responsible for sharing it.')}</span>
      </label>
    </div>
  )
}

/** Text size of the block you are on, in px: minus, the number, plus. */
function SizeControl({ active, onSize }: { active: ActiveBlock; onSize: (n: number) => void }) {
  const size = active?.size ?? null
  const [draft, setDraft] = useState('')
  useEffect(() => { setDraft(size == null ? '' : String(size)) }, [size])
  const off = size == null
  const btn = 'w-8 h-8 rounded-md flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default'
  const commit = () => { const n = Number(draft); if (Number.isFinite(n) && n > 0) onSize(n); else setDraft(size == null ? '' : String(size)) }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] px-2.5" style={{ color: 'var(--c-muted)', letterSpacing: '0.04em' }}>{t('حجم النص', 'Text size')}</span>
      <div className="flex items-center gap-1.5 px-2.5" dir="ltr">
        <button type="button" className={btn} disabled={off} onMouseDown={(ev) => ev.preventDefault()} onClick={() => size != null && onSize(size - 1)} aria-label={t('أصغر', 'Smaller')} style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
          <ElementIcon size={14} d="M5 10h10" />
        </button>
        <input
          type="number" inputMode="decimal" min={12} max={48} step={1} disabled={off}
          value={draft} placeholder="–"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
          aria-label={t('حجم النص بالبكسل', 'Text size in px')}
          className="w-14 h-8 rounded-md text-center font-mono text-[13px] outline-none disabled:opacity-40"
          style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border-mid)', color: 'var(--c-text)' }}
        />
        <button type="button" className={btn} disabled={off} onMouseDown={(ev) => ev.preventDefault()} onClick={() => size != null && onSize(size + 1)} aria-label={t('أكبر', 'Larger')} style={{ background: 'var(--c-surface-alt)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
          <ElementIcon size={14} d="M10 5v10M5 10h10" />
        </button>
        <span className="font-mono text-[11px]" style={{ color: 'var(--c-muted-2)' }}>px</span>
      </div>
      {off && <span className="text-[11px] px-2.5" style={{ color: 'var(--c-muted-2)' }}>{t('اضغط على سطر لتغيير حجمه.', 'Click a line to change its size.')}</span>}
    </div>
  )
}
