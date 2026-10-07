import { useEffect, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { t, useLang } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import { PageHeader } from '../components/cine'
import { Btn, Chip, Field, Notice, Spinner, TextArea, TextInput } from '../components/mk'
import { ArticleBody, WritingCover } from '../components/writing'
import {
  getWriting, myWriterStatus, removeWritingFile, saveWriting, uploadWritingPdf, writingError,
  WRITING_KINDS, WRITING_LIMITS, type Writing, type WriterStatus, type WritingKind,
} from '../lib/writings'

const DRAFT_KEY = 'mk-writing-draft'
const box = { background: 'var(--c-surface)', border: '1px solid var(--c-border)' } as const

interface Draft { kind: WritingKind; title: string; summary: string; body: string }
const readDraft = (): Draft | null => {
  try { const v = localStorage.getItem(DRAFT_KEY); return v ? (JSON.parse(v) as Draft) : null } catch { return null }
}
const writeDraft = (d: Draft | null) => {
  try { if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); else localStorage.removeItem(DRAFT_KEY) } catch { /* storage off */ }
}

const KIND_HINT: Record<WritingKind, [string, string]> = {
  article: ['تكتبه هنا على Makers: رأي، تجربة، درس من موقع التصوير.', 'Written here on Makers: a view, an experience, a lesson from set.'],
  script: ['سيناريو منجز ترفعه ملف PDF.', 'A finished screenplay, uploaded as a PDF.'],
  storyboard: ['ستوري بورد منجز ترفعه ملف PDF.', 'A finished storyboard, uploaded as a PDF.'],
}

export default function WritingEditor({ id }: { id?: string }) {
  useLang()
  const { go } = useRouter()
  const toast = useToast()
  const { session, profile, loading } = useAuth()
  const [status, setStatus] = useState<WriterStatus | null>(null)
  const [existing, setExisting] = useState<Writing | null | undefined>(id ? undefined : null)

  const [draft] = useState(() => (!id ? readDraft() : null))
  const [kind, setKind] = useState<WritingKind>(draft?.kind || 'article')
  const [title, setTitle] = useState(draft?.title || '')
  const [summary, setSummary] = useState(draft?.summary || '')
  const [body, setBody] = useState(draft?.body || '')
  const [file, setFile] = useState<File | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<'public' | 'members'>('public')
  const [completed, setCompleted] = useState(false)
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (session) myWriterStatus().then(setStatus) }, [session])

  useEffect(() => {
    if (!id) return
    getWriting(id).then((w) => {
      setExisting(w)
      if (!w) return
      setKind(w.kind); setTitle(w.title); setSummary(w.summary || ''); setBody(w.body || '')
      setFilePath(w.file_path); setFileName(w.file_name); setVisibility(w.visibility); setCompleted(w.completed)
    })
  }, [id])

  // Keep an unsent new article in this browser, so a closed tab does not lose it.
  useEffect(() => {
    if (id) return
    const h = setTimeout(() => writeDraft(title || summary || body ? { kind, title, summary, body } : null), 600)
    return () => clearTimeout(h)
  }, [id, kind, title, summary, body])

  if (loading || (session && !status) || existing === undefined) return <Spinner />
  if (!session || !profile) {
    return <Wrap><Notice>{t('سجّل الدخول لتكتب على Makers.', 'Sign in to write on Makers.')} <Link to={`/login?next=${id ? `/writing/${id}/edit` : '/writing/new'}`} className="font-semibold underline">{t('دخول', 'Sign in')}</Link></Notice></Wrap>
  }
  if (!status?.writer) {
    return (
      <Wrap>
        <PageHeader title={t('اكتب على Makers', 'Write on Makers')} />
        <Notice>
          {profile.status !== 'approved'
            ? t('تفتح الكتابة بعد موافقة فريق Makers على صفحتك.', 'Writing opens once the Makers team approves your page.')
            : t('النشر في الكتابات لأصحاب تخصصات الكتابة: كاتب محتوى، كاتب سيناريو، رسام ستوري بورد. إن كان هذا تخصصك أضفه إلى صفحتك.', 'Writing is for members with a writing specialty: content writer, screenwriter, storyboard artist. If that is you, add it to your page.')}
          {' '}{profile.status === 'approved' && <Link to="/me" className="font-semibold underline">{t('عدّل صفحتك', 'Edit your page')}</Link>}
        </Notice>
      </Wrap>
    )
  }
  if (id && (!existing || existing.owner_id !== profile.id)) return <Wrap><Notice tone="error">{t('لا يمكنك تعديل هذه الكتابة.', 'You cannot edit this writing.')}</Notice></Wrap>
  if (existing?.status === 'hidden') return <Wrap><Notice tone="error">{t('أخفى فريق Makers هذه الكتابة، ولا يمكن تعديلها.', 'The Makers team hid this writing. It cannot be edited.')}</Notice></Wrap>

  const isArticle = kind === 'article'
  const left = Math.max(0, 5 - status.reviewed)

  const wrap = (before: string, after = '', line = false) => {
    const el = area.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b, value } = el
    let next: string
    let caret: number
    if (line) {
      const start = value.lastIndexOf('\n', a - 1) + 1
      next = value.slice(0, start) + before + value.slice(start)
      caret = b + before.length
    } else {
      const sel = value.slice(a, b) || t('نص', 'text')
      next = value.slice(0, a) + before + sel + after + value.slice(b)
      caret = a + before.length + sel.length + after.length
    }
    setBody(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret) })
  }

  const pickFile = (f: File | null | undefined) => {
    setError(null)
    if (!f) return
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) return setError(t('الملف يجب أن يكون PDF.', 'The file must be a PDF.'))
    if (f.size > WRITING_LIMITS.pdfBytes) return setError(t('حجم الملف أكبر من 20 ميغابايت.', 'The file is larger than 20 MB.'))
    setFile(f)
  }

  const submit = async () => {
    setError(null)
    const tt = title.trim()
    if (tt.length < 3) return setError(t('اكتب عنواناً من 3 أحرف على الأقل.', 'Write a title of at least 3 characters.'))
    if (isArticle && body.trim().length < WRITING_LIMITS.bodyMin) return setError(t(`المقال يحتاج ${WRITING_LIMITS.bodyMin} حرفاً على الأقل. كتبت ${body.trim().length}.`, `An article needs at least ${WRITING_LIMITS.bodyMin} characters. You have ${body.trim().length}.`))
    if (!isArticle && !file && !filePath) return setError(t('ارفع ملف PDF للعمل.', 'Upload the PDF of the work.'))
    if (!isArticle && !completed) return setError(t('أكّد أن العمل منجز ومكتمل. لا ننشر الأعمال غير المكتملة.', 'Confirm the work is finished. We do not publish unfinished work.'))

    setBusy(true)
    let uploaded: string | null = null
    try {
      if (!isArticle && file) uploaded = await uploadWritingPdf(profile.id, file)
      const path = isArticle ? null : uploaded || filePath
      const name = isArticle ? null : file ? file.name.slice(0, 200) : fileName
      const newId = await saveWriting(id || null, { kind, title: tt, summary: summary.trim(), body: isArticle ? body : '', file_path: path, file_name: name, visibility: isArticle ? 'public' : visibility, completed: !isArticle && completed })
      // The old PDF is no longer used once a new one is saved, or the writing became an article.
      if (filePath && filePath !== path) await removeWritingFile(filePath)
      if (!id) writeDraft(null)
      toast(status.trusted ? t('نُشرت كتابتك', 'Your writing is live') : t('وصلت كتابتك إلى الفريق للمراجعة', 'Sent to the team for review'))
      go(`/writing/${newId}`)
    } catch (e) {
      if (uploaded) await removeWritingFile(uploaded)
      setBusy(false)
      setError(e instanceof Error && /storage|bucket|mime|size/i.test(e.message) ? t('تعذّر رفع الملف. تأكد أنه PDF أقل من 20 ميغابايت.', 'Could not upload the file. Make sure it is a PDF under 20 MB.') : writingError(e))
    }
  }

  return (
    <Wrap>
      <PageHeader title={id ? t('عدّل الكتابة', 'Edit writing') : t('اكتب على Makers', 'Write on Makers')} />

      {status.trusted ? (
        <Notice tone="success">{t('تُنشر كتاباتك مباشرة. نثق بك، فالتزم بسياسات Makers وأخلاقيات المهنة: أعمالك أنت فقط، واذكر مصادرك، واحترم حقوق الآخرين.', 'You publish directly. Keep to the Makers policies and the ethics of the craft: your own work only, credit your sources, respect other people\'s rights.')}</Notice>
      ) : (
        <Notice>{t(`يراجع فريق Makers أول خمس كتابات لكل كاتب قبل نشرها. بقي لك ${left} ${left === 1 ? 'كتابة' : 'كتابات'} قبل أن تُنشر كتاباتك مباشرة.`, `The Makers team reviews each writer's first five pieces before they go live. ${left} left before you publish directly.`)}{id && existing?.status === 'published' ? ' ' + t('أي تعديل يعيدها إلى المراجعة.', 'Any edit sends it back to review.') : ''}</Notice>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
          <Field label={t('نوع الكتابة', 'Kind')}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {WRITING_KINDS.map((k) => (
                <button key={k.key} type="button" onClick={() => setKind(k.key)} aria-pressed={kind === k.key} className="text-start rounded-xl p-4 flex flex-col gap-1 cursor-pointer transition-colors" style={{ background: kind === k.key ? 'rgba(var(--c-accent-rgb),0.10)' : 'var(--c-surface)', border: `1px solid ${kind === k.key ? 'var(--c-accent)' : 'var(--c-border)'}`, color: 'var(--c-text)' }}>
                  <span className="font-bold text-[14px]">{t(k.ar, k.en)}</span>
                  <span className="text-[12px] leading-relaxed" style={{ color: 'var(--c-muted)' }}>{t(...KIND_HINT[k.key])}</span>
                </button>
              ))}
            </div>
          </Field>

          {!isArticle && (
            <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.35)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5" aria-hidden="true"><path d="M10 2.5l8 14H2l8-14z" stroke="#FF8A80" strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 8v4M10 14.5v.5" stroke="#FF8A80" strokeWidth="1.6" strokeLinecap="round" /></svg>
              <div className="flex flex-col gap-1 text-[13px] leading-relaxed" style={{ color: '#FFB4AD' }}>
                <strong>{t('تنبيه: ننشر الأعمال المنجزة فقط', 'Notice: finished work only')}</strong>
                <span>{t('شارك السيناريو أو الستوري بورد بعد اكتماله فقط. لا ترفع فكرة قيد التطوير أو مشروعاً لم يُنتج بعد وتخشى عليه، فالملف المنشور يقرؤه غيرك. ارفع عملك أنت فقط، أو عملاً تملك إذن نشره.', 'Share a script or storyboard only once it is complete. Do not upload an idea in development or an unproduced project you want to protect: a published file is read by others. Upload only your own work, or work you have permission to publish.')}</span>
              </div>
            </div>
          )}

          <Field label={t('العنوان', 'Title')} hint={<span className="font-mono" dir="ltr">{[...title].length}/{WRITING_LIMITS.title}</span>}>
            <TextInput dir="auto" value={title} maxLength={WRITING_LIMITS.title} onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))} placeholder={t('عنوان واضح يلفت القارئ', 'A clear title that pulls the reader in')} />
          </Field>

          <Field label={isArticle ? t('سطر تعريفي (اختياري)', 'Standfirst (optional)') : t('نبذة عن العمل', 'About the work')} hint={<span className="font-mono" dir="ltr">{summary.length}/{WRITING_LIMITS.summary}</span>}>
            <TextArea dir="auto" rows={3} maxLength={WRITING_LIMITS.summary} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={isArticle ? t('جملة أو جملتان تظهران تحت العنوان', 'One or two lines under the title') : t('عن ماذا يدور العمل، نوعه ومدته، وهل أُنتج', 'What it is about, its format and length, and whether it was produced')} />
          </Field>

          {isArticle ? (
            <Field label={t('المقال', 'Article')} hint={<span className="font-mono" dir="ltr" style={{ color: body.trim().length < WRITING_LIMITS.bodyMin ? 'var(--c-muted-2)' : 'var(--c-live)' }}>{body.trim().length < WRITING_LIMITS.bodyMin ? `${body.trim().length}/${WRITING_LIMITS.bodyMin}` : body.trim().length.toLocaleString('en')}</span>}>
              <div className="rounded-xl overflow-hidden" style={box}>
                <div className="flex items-center gap-1 px-2 py-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {!preview && (
                    <>
                      <ToolBtn onClick={() => wrap('## ', '', true)} label={t('عنوان فرعي', 'Heading')}>H</ToolBtn>
                      <ToolBtn onClick={() => wrap('**', '**')} label={t('عريض', 'Bold')}><strong>B</strong></ToolBtn>
                      <ToolBtn onClick={() => wrap('> ', '', true)} label={t('اقتباس', 'Quote')}>”</ToolBtn>
                      <ToolBtn onClick={() => wrap('- ', '', true)} label={t('قائمة', 'List')}>•</ToolBtn>
                    </>
                  )}
                  <span className="flex-1" />
                  <Chip on={!preview} onClick={() => setPreview(false)} className="!py-1 !px-3 !text-[12px]">{t('كتابة', 'Write')}</Chip>
                  <Chip on={preview} onClick={() => setPreview(true)} className="!py-1 !px-3 !text-[12px]">{t('معاينة', 'Preview')}</Chip>
                </div>
                {preview ? (
                  <div className="p-5 md:p-7 min-h-[420px]">{body.trim() ? <ArticleBody body={body} /> : <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('لا يوجد نص بعد.', 'Nothing written yet.')}</span>}</div>
                ) : (
                  <textarea
                    ref={area}
                    dir="auto"
                    value={body}
                    maxLength={WRITING_LIMITS.body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t('ابدأ الكتابة هنا…\n\nسطر فارغ يبدأ فقرة جديدة. استعمل الأزرار فوق للعنوان الفرعي والاقتباس.', 'Start writing here…\n\nA blank line starts a new paragraph. Use the buttons above for headings and quotes.')}
                    className="w-full block p-5 md:p-6 outline-none resize-y"
                    style={{ minHeight: 420, background: 'transparent', border: 'none', color: 'var(--c-text)', fontSize: 16, fontWeight: 400, lineHeight: 1.95 }}
                  />
                )}
              </div>
            </Field>
          ) : (
            <>
              <Field label={t('ملف العمل (PDF)', 'The work (PDF)')} hint={t('حتى 20 ميغابايت', 'Up to 20 MB')}>
                <label
                  className="rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors"
                  style={{ background: 'var(--c-surface)', border: '1.5px dashed var(--c-border-mid)', minHeight: 130 }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
                >
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded" dir="ltr" style={{ border: '1px solid var(--c-border-mid)', color: 'var(--c-accent)' }}>PDF</span>
                  {file || fileName ? (
                    <>
                      <span dir="auto" className="text-sm font-semibold break-all">{file?.name || fileName}</span>
                      <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB · ` : ''}{t('اضغط لتبديل الملف', 'Click to replace')}</span>
                    </>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{t('اسحب الملف هنا أو اضغط لاختياره', 'Drop the file here or click to choose')}</span>
                  )}
                </label>
              </Field>

              <Field label={t('من يقرأ الملف', 'Who can read the file')}>
                <div className="flex gap-2 flex-wrap">
                  <Chip on={visibility === 'public'} onClick={() => setVisibility('public')}>{t('الجميع', 'Everyone')}</Chip>
                  <Chip on={visibility === 'members'} onClick={() => setVisibility('members')}>{t('أعضاء Makers فقط', 'Makers members only')}</Chip>
                </div>
              </Field>

              <label className="flex gap-3 items-start rounded-xl p-4 cursor-pointer" style={{ ...box, borderColor: completed ? 'var(--c-accent)' : 'var(--c-border)' }}>
                <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="mt-1 w-4 h-4 shrink-0" style={{ accentColor: 'var(--c-accent)' }} />
                <span className="text-[13.5px] leading-relaxed">
                  {t('أؤكد أن هذا العمل منجز ومكتمل، وأنه من كتابتي أو أملك حق نشره، وأتحمّل مسؤولية مشاركته.', 'I confirm this work is finished and complete, that I wrote it or have the right to publish it, and that I am responsible for sharing it.')}
                </span>
              </label>
            </>
          )}

          {error && <Notice tone="error">{error}</Notice>}

          <div className="flex gap-2 flex-wrap">
            <Btn disabled={busy} onClick={submit}>{busy ? t('جارٍ الإرسال…', 'Sending…') : status.trusted ? t('انشر', 'Publish') : t('أرسل للمراجعة', 'Send for review')}</Btn>
            <Btn variant="outline" disabled={busy} onClick={() => go(id ? `/writing/${id}` : '/writing')}>{t('إلغاء', 'Cancel')}</Btn>
          </div>
        </div>

        <aside className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-24 flex flex-col gap-2.5">
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>{t('الغلاف يُصنع من العنوان تلقائياً', 'The cover is made from your title')}</span>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
            <WritingCover w={{ kind, title: title.trim() || t('عنوان كتابتك', 'Your title'), owner: profile }} />
          </div>
        </aside>
      </div>
    </Wrap>
  )
}

function ToolBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={label} aria-label={label} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-[14px] hover:bg-white/5" style={{ background: 'none', border: 'none', color: 'var(--c-text)' }}>
      {children}
    </button>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[1120px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-10 flex flex-col gap-6">{children}</div>
}
