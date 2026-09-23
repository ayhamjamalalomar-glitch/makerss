import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link, { useRouter } from '../lib/router'
import { supabase, PUBLIC_PROFILE_COLUMNS, type Profile } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { t, getLang } from '../lib/i18n'
import { formatDateAr, relativeAr } from '../lib/constants'
import { roleLine, useSpecialties } from '../lib/specialties'
import { splitLinks, type Conversation, type Message } from '../lib/messages'
import { Avatar, Card, Notice, PageShell, Spinner, VerifiedBadge } from '../components/mk'

const MUTED = '#5C5C59'
const readParam = () => new URLSearchParams(window.location.search).get('c')
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(getLang() === 'en' ? 'en-GB' : 'ar-JO', { hour: '2-digit', minute: '2-digit' })
const localDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function MessagesPage() {
  const { session, profile, loading } = useAuth()
  const { go } = useRouter()
  const me = session?.user.id
  const [convs, setConvs] = useState<Conversation[] | null>(null)
  const [people, setPeople] = useState<Record<string, Profile>>({})
  const [sel, setSel] = useState<string | null>(readParam())
  const [unread, setUnread] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!loading && !session) go('/login?next=/messages')
  }, [loading, session, go])

  const loadList = useCallback(async () => {
    if (!me) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a.eq.${me},user_b.eq.${me}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    const list = (data as Conversation[]) || []
    setConvs(list)
    const others = [...new Set(list.map((c) => (c.user_a === me ? c.user_b : c.user_a)))]
    if (others.length) {
      const { data: ps } = await supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).in('id', others)
      const map: Record<string, Profile> = {}
      for (const p of (ps as unknown as Profile[]) || []) map[p.id] = p
      setPeople((cur) => ({ ...cur, ...map }))
    }
    const { data: un } = await supabase.from('messages').select('conversation_id').is('read_at', null).neq('sender_id', me)
    const counts: Record<string, number> = {}
    for (const r of (un as { conversation_id: string }[]) || []) counts[r.conversation_id] = (counts[r.conversation_id] || 0) + 1
    setUnread(counts)
  }, [me])

  useEffect(() => { loadList() }, [loadList])

  // Any new message anywhere: refresh the list (RLS limits events to my conversations)
  useEffect(() => {
    if (!me) return
    const ch = supabase
      .channel(`convs-${me}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadList())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [me, loadList])

  useEffect(() => {
    const onPop = () => setSel(readParam())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = (id: string | null) => {
    setSel(id)
    window.history.pushState(null, '', id ? `/messages?c=${id}` : '/messages')
  }

  if (loading || !profile || convs === null) return <PageShell><Spinner /></PageShell>

  if (profile.status !== 'approved') {
    return (
      <PageShell narrow>
        <Card className="p-10 text-center flex flex-col gap-2 items-center">
          <span className="text-lg font-bold">{t('الرسائل متاحة بعد نشر صفحتك', 'Messages open once your page is live')}</span>
          <span className="text-sm" style={{ color: MUTED }}>{t('عندما يوافق فريق Makers على صفحتك، تستطيع مراسلة باقي الأعضاء.', 'When the Makers team approves your page, you can message other members.')}</span>
          <Link to="/me" className="text-sm font-semibold mt-2" style={{ color: '#2563EB' }}>{t('أكمل صفحتك', 'Complete your page')}</Link>
        </Card>
      </PageShell>
    )
  }

  const current = convs.find((c) => c.id === sel) || null
  const otherOf = (c: Conversation) => (c.user_a === me ? c.user_b : c.user_a)

  return (
    <PageShell>
      <div className={`flex flex-col gap-1.5 md:px-2 ${current ? 'hidden md:flex' : ''}`}>
        <h1 className="m-0 text-[28px] md:text-[32px] font-bold">{t('الرسائل', 'Messages')}</h1>
        <span className="text-sm" style={{ color: MUTED }}>{t('تحدّث مع باقي أعضاء Makers مباشرة.', 'Talk to other Makers members directly.')}</span>
      </div>

      {convs.length === 0 && !current ? (
        <Card className="p-10 text-center flex flex-col gap-2">
          <span className="text-lg font-bold">{t('لا توجد محادثات بعد', 'No conversations yet')}</span>
          <span className="text-sm" style={{ color: MUTED }}>{t('افتح صفحة أي عضو في الدليل واضغط «راسِل» لتبدأ محادثة.', 'Open any member page in the directory and tap "Message" to start a conversation.')}</span>
          <Link to="/" className="text-sm font-semibold mt-2" style={{ color: '#2563EB' }}>{t('تصفّح الدليل', 'Browse the directory')}</Link>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:h-[calc(100vh-260px)] md:min-h-[520px]">
          <div className={`md:w-[320px] shrink-0 flex-col gap-2 md:overflow-y-auto ${current ? 'hidden md:flex' : 'flex'}`}>
            {convs.map((c) => {
              const o = people[otherOf(c)]
              const n = unread[c.id] || 0
              return (
                <button key={c.id} type="button" onClick={() => open(c.id)} className="flex items-center gap-3 p-3.5 rounded-[22px] bg-white cursor-pointer text-start" style={{ border: c.id === sel ? '1.5px solid #111' : '1px solid #ECECEA' }}>
                  <Avatar url={o?.avatar_url} name={o?.full_name} size={44} />
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold truncate">{o?.full_name || t('عضو', 'Member')}</span>
                      {c.last_message_at && <span className="text-[11px] shrink-0" style={{ color: MUTED }}>{relativeAr(c.last_message_at)}</span>}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span dir="auto" className="text-[13px] truncate" style={{ color: n ? '#111' : MUTED, fontWeight: n ? 600 : 400 }}>
                        {c.last_sender === me ? t('أنت: ', 'You: ') : ''}{c.last_message_preview || t('محادثة جديدة', 'New conversation')}
                      </span>
                      {n > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center shrink-0" style={{ background: '#2563EB' }}>{n}</span>}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {current ? (
            <Thread key={current.id} conv={current} me={me as string} other={people[otherOf(current)]} onBack={() => open(null)} onChanged={loadList} />
          ) : (
            <Card className="hidden md:flex flex-1 items-center justify-center text-sm" style={{ color: MUTED }}>{t('اختر محادثة من القائمة.', 'Pick a conversation from the list.')}</Card>
          )}
        </div>
      )}
    </PageShell>
  )
}

function Thread({ conv, me, other, onBack, onChanged }: { conv: Conversation; me: string; other?: Profile; onBack: () => void; onChanged: () => void }) {
  const specialties = useSpecialties()
  const [msgs, setMsgs] = useState<Message[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [menu, setMenu] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const otherId = conv.user_a === me ? conv.user_b : conv.user_a

  const markRead = useCallback(async () => {
    await supabase.rpc('mark_conversation_read', { p_conv: conv.id })
    window.dispatchEvent(new Event('mk-messages-read'))
    onChanged()
  }, [conv.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at').limit(500).then(({ data }) => {
      setMsgs((data as Message[]) || [])
      markRead()
    })
    supabase.from('blocks').select('blocked').eq('blocked', otherId).then(({ data }) => setBlocked(!!data?.length))
    const ch = supabase
      .channel(`thread-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, (payload) => {
        const m = payload.new as Message
        setMsgs((cur) => (cur && !cur.some((x) => x.id === m.id) ? [...cur, m] : cur))
        if (m.sender_id !== me) markRead()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, (payload) => {
        const m = payload.new as Message
        setMsgs((cur) => cur?.map((x) => (x.id === m.id ? m : x)) || cur)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [conv.id, otherId, me, markRead])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs?.length])

  const send = async () => {
    const body = text.trim()
    if (!body || busy) return
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.rpc('send_message', { p_conv: conv.id, p_body: body })
    setBusy(false)
    if (error) {
      const m = error.message || ''
      return setError(m.includes('too many') ? t('أرسلت رسائل كثيرة خلال وقت قصير. انتظر قليلاً.', 'You sent many messages in a short time. Wait a moment.')
        : m.includes('blocked') ? t('لا يمكن إرسال رسائل في هذه المحادثة.', 'Messages cannot be sent in this conversation.')
          : t('تعذّر إرسال الرسالة. حاول مرة أخرى.', 'Could not send the message. Try again.'))
    }
    setText('')
    // show it immediately; realtime will not duplicate it
    const id = data as string
    setMsgs((cur) => (cur && !cur.some((x) => x.id === id) ? [...cur, { id, conversation_id: conv.id, sender_id: me, body, created_at: new Date().toISOString(), read_at: null }] : cur))
    onChanged()
  }

  const toggleBlock = async () => {
    setMenu(false)
    const { error } = await supabase.rpc('set_block', { p_other: otherId, p_value: !blocked })
    if (!error) setBlocked(!blocked)
  }

  const role = other ? roleLine(specialties, other.specialty_ids, other.other_specialty) : ''
  const lastMineRead = useMemo(() => [...(msgs || [])].reverse().find((m) => m.sender_id === me), [msgs, me])

  return (
    <Card className="flex-1 flex flex-col min-h-[70vh] md:min-h-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 md:px-6 py-3.5" style={{ borderBottom: '1px solid #F0F0EE' }}>
        <button type="button" onClick={onBack} aria-label={t('رجوع', 'Back')} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center cursor-pointer" style={{ background: '#F3F3F2', border: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ltr:-scale-x-100"><path d="M10 6l6 6-6 6" /></svg>
        </button>
        <Link to={other?.username ? `/${other.username}` : '#'} className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar url={other?.avatar_url} name={other?.full_name} size={42} />
          <span className="flex flex-col min-w-0">
            <span className="text-[15px] font-bold truncate">{other?.full_name || t('عضو', 'Member')}{other?.is_founding && <span className="inline-block align-middle ms-1.5 -mt-0.5"><VerifiedBadge size={16} /></span>}</span>
            {role && <span className="text-xs truncate" style={{ color: MUTED }}>{role}</span>}
          </span>
        </Link>
        <div className="relative">
          <button type="button" onClick={() => setMenu(!menu)} aria-label={t('خيارات', 'Options')} className="w-9 h-9 rounded-full cursor-pointer text-lg" style={{ background: '#F3F3F2', border: 'none' }}>⋯</button>
          {menu && (
            <div className="absolute end-0 top-11 z-20 bg-white rounded-2xl p-1.5 min-w-[180px]" style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.14)', border: '1px solid #ECECEA' }}>
              {other?.username && <Link to={`/${other.username}`} className="block px-3.5 py-2.5 rounded-xl text-sm hover:bg-[#F7F7F6]">{t('افتح صفحته', 'View profile')}</Link>}
              <button type="button" onClick={toggleBlock} className="w-full text-start px-3.5 py-2.5 rounded-xl text-sm cursor-pointer bg-transparent border-0 hover:bg-[#F7F7F6]" style={{ color: blocked ? '#111' : '#B42318' }}>
                {blocked ? t('إلغاء الحظر', 'Unblock') : t('حظر هذا العضو', 'Block this member')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col gap-1.5" style={{ background: '#FBFBFA' }}>
        {msgs === null && <Spinner />}
        {msgs?.length === 0 && (
          <div className="m-auto text-center text-sm max-w-[320px]" style={{ color: MUTED }}>
            {t(`ابدأ المحادثة مع ${other?.full_name?.split(' ')[0] || ''}. عرّف بنفسك واذكر ما تحتاجه باختصار.`, `Start the conversation with ${other?.full_name?.split(' ')[0] || ''}. Introduce yourself and say briefly what you need.`)}
          </div>
        )}
        {msgs?.map((m, i) => {
          const mine = m.sender_id === me
          const newDay = i === 0 || localDay(msgs[i - 1].created_at) !== localDay(m.created_at)
          const grouped = !newDay && i > 0 && msgs[i - 1].sender_id === m.sender_id
          return (
            <div key={m.id} className="flex flex-col">
              {newDay && <span className="self-center text-[11px] px-3 py-1 rounded-full my-3" style={{ background: '#F0F0EE', color: MUTED }}>{formatDateAr(localDay(m.created_at))}</span>}
              <div className={`flex ${grouped ? '' : 'mt-1.5'}`}>
                <div
                  dir="auto"
                  className="max-w-[78%] md:max-w-[65%] px-4 py-2.5 text-[15px] whitespace-pre-wrap break-words"
                  style={mine
                    ? { background: '#2563EB', color: '#fff', borderRadius: 20, borderStartEndRadius: grouped ? 20 : 6, marginInlineStart: 'auto' }
                    : { background: '#FFFFFF', color: '#111', border: '1px solid #ECECEA', borderRadius: 20, borderStartStartRadius: grouped ? 20 : 6, marginInlineEnd: 'auto' }}
                >
                  {splitLinks(m.body).map((p, k) => (p.href ? <a key={k} href={p.href} target="_blank" rel="noreferrer noopener" className="underline" style={{ color: 'inherit' }}>{p.text}</a> : <span key={k}>{p.text}</span>))}
                  <span className="block text-[10px] mt-1 opacity-70" dir="ltr" style={{ textAlign: 'end' }}>{timeOf(m.created_at)}</span>
                </div>
              </div>
              {mine && lastMineRead?.id === m.id && m.read_at && <span className="text-[11px] mt-1 self-end" style={{ color: MUTED }}>{t('تمت القراءة', 'Seen')}</span>}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="px-3 md:px-5 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid #F0F0EE' }}>
        {error && <Notice tone="error">{error}</Notice>}
        {blocked ? (
          <div className="text-sm text-center py-2" style={{ color: MUTED }}>{t('حظرت هذا العضو. ألغِ الحظر من القائمة لتراسله.', 'You blocked this member. Unblock from the menu to message them.')}</div>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              dir="auto"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
              rows={1}
              maxLength={4000}
              placeholder={t('اكتب رسالة…', 'Write a message…')}
              className="flex-1 resize-none"
              style={{ minHeight: 48, maxHeight: 160, padding: '13px 18px', borderRadius: 24, fontSize: 15, lineHeight: 1.5 }}
            />
            <button type="button" onClick={send} disabled={busy || !text.trim()} aria-label={t('إرسال', 'Send')} className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0" style={{ background: '#2563EB', color: '#fff', border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="rtl:-scale-x-100" aria-hidden="true"><path d="M3.4 20.4l17.5-7.5a1 1 0 000-1.8L3.4 3.6a1 1 0 00-1.4 1.1L4 11l9 1-9 1-2 6.3a1 1 0 001.4 1.1z" /></svg>
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
