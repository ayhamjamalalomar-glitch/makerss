import { useState } from 'react'
import type { Navigate, Page } from '../App'
import { supabase } from '../lib/supabase'
import { Button, Input, Label, Notice } from '../components/ui'

interface AuthPageProps {
  navigate: Navigate
  mode?: 'signin' | 'signup' | 'update'
  next?: Page
}

export default function AuthPage({ navigate, mode: initialMode = 'signin', next }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'update'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const redirectTo = window.location.origin + (next?.name === 'admin' ? '/admin' : '/')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate(next || { name: 'request-invite' })
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: redirectTo },
        })
        if (error) throw error
        if (data.session) {
          navigate(next || { name: 'request-invite' })
        } else {
          setInfo('Check your inbox and confirm your email. Then come back and sign in.')
        }
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        setInfo('Password updated. You are signed in.')
        setTimeout(() => navigate(next || { name: 'request-invite' }), 1200)
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
        if (error) throw error
        setInfo('If this email has an account, a reset link is on its way.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your account' : mode === 'update' ? 'Set a new password' : 'Reset password'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-inter font-bold text-paper mb-2" style={{ fontSize: 30, letterSpacing: '-0.02em' }}>{title}</h1>
        <p className="font-inter text-muted text-sm mb-8">
          {mode === 'signup'
            ? 'Makers is invite only. Create an account, then complete your application for review.'
            : mode === 'signin'
              ? 'Welcome back to Makers.'
              : mode === 'update'
                ? 'Choose a new password for your account.'
                : 'Enter your email and we will send you a reset link.'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-5">
          {mode === 'signup' && (
            <label className="flex flex-col gap-2">
              <Label required>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your name" />
            </label>
          )}
          {mode !== 'update' && (
            <label className="flex flex-col gap-2">
              <Label required>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
            </label>
          )}
          {mode !== 'reset' && (
            <label className="flex flex-col gap-2">
              <Label required>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>
          )}

          {error && <Notice tone="error">{error}</Notice>}
          {info && <Notice tone="success">{info}</Notice>}

          <Button type="submit" disabled={busy} className="py-3.5" style={{ fontSize: 14 }}>
            {busy ? 'Please wait…' : title}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 font-inter text-sm text-muted">
          {mode === 'signin' && (
            <>
              <button className="text-left hover:text-paper" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setMode('signup')}>
                New to Makers? <span style={{ color: '#E85D04' }}>Create an account</span>
              </button>
              <button className="text-left hover:text-paper" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setMode('reset')}>
                Forgot your password?
              </button>
            </>
          )}
          {(mode === 'signup' || mode === 'reset') && (
            <button className="text-left hover:text-paper" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} onClick={() => setMode('signin')}>
              Already have an account? <span style={{ color: '#E85D04' }}>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
