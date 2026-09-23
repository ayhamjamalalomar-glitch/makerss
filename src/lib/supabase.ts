import { createClient } from '@supabase/supabase-js'

// Publishable key is safe in the browser: access is enforced by Row Level Security in the database.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ggtdseujebmfugwcbnyk.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_OlQKED89zR7MzfM90jE6PQ_rSwjAvs4'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export type MemberStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
export type MemberRole = 'member' | 'reviewer' | 'admin'
export type AccountType = 'creator' | 'maker'

export interface WorkLink {
  url: string
  type?: 'reels' | 'youtube' | 'vimeo' | 'other'
}

export interface Profile {
  id: string
  email?: string | null
  full_name: string | null
  name_ar: string | null
  username: string | null
  account_type: AccountType | null
  status: MemberStatus
  role: MemberRole
  is_founding: boolean
  avatar_url: string | null
  bio: string | null
  city: string | null
  country: string | null
  specialty_ids: number[]
  other_specialty: string | null
  content_types: string[]
  video_length: 'short' | 'long' | 'both' | null
  socials: Record<string, string>
  followers: Record<string, number>
  work_links: WorkLink[]
  referred_by: string | null
  invite_code_used?: string | null
  invites_remaining: number
  review_note?: string | null
  reviewed_at?: string | null
  submitted_at: string | null
  created_at: string
  start_year?: number | null
  available?: boolean
  is_featured?: boolean
}

export interface Specialty {
  id: number
  name_en: string
  name_ar: string | null
  is_video: boolean
  is_active: boolean
  sort: number
}

export const PUBLIC_PROFILE_COLUMNS =
  'id, full_name, name_ar, username, account_type, status, role, is_founding, avatar_url, bio, city, country, specialty_ids, other_specialty, content_types, video_length, socials, followers, work_links, invites_remaining, submitted_at, last_active_at, created_at, updated_at, referred_by, start_year, available, is_featured'

export interface Work {
  id: string
  owner_id: string
  title: string
  year: number | null
  role: string | null
  platform: string | null
  url: string | null
  thumbnail_url?: string | null
  created_at: string
}

export interface Award {
  id: string
  owner_id: string
  rank: string
  org: string | null
  year: number | null
}

export interface ContactRequest {
  id: string
  to_id: string
  sender_name: string
  project_type: string | null
  country: string | null
  city: string | null
  budget: string | null
  start_date: string | null
  end_date: string | null
  details: string
  status: 'new' | 'accepted' | 'declined' | 'expired'
  responded_at: string | null
  created_at: string
}
