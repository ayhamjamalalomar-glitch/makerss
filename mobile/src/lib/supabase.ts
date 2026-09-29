import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'

// Same project as the website. The publishable key is safe in the app: Row Level Security protects the data.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ggtdseujebmfugwcbnyk.supabase.co'
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_OlQKED89zR7MzfM90jE6PQ_rSwjAvs4'

export const supabase = createClient(url, key, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// Refresh the session only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}

export interface Profile {
  id: string
  full_name: string | null
  name_ar: string | null
  username: string | null
  account_type: 'creator' | 'maker' | null
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
  is_founding: boolean
  avatar_url: string | null
  bio: string | null
  about?: string | null
  city: string | null
  country: string | null
  specialty_ids: number[]
  other_specialty: string | null
  content_types: string[]
  socials: Record<string, string>
  followers: Record<string, number>
  created_at: string
  start_year?: number | null
  available?: boolean
  is_featured?: boolean
  featured_work_ids?: string[]
}

export interface Specialty {
  id: number
  name_en: string
  name_ar: string | null
  is_active: boolean
  sort: number
}

export const PUBLIC_PROFILE_COLUMNS =
  'id, full_name, name_ar, username, account_type, status, is_founding, avatar_url, bio, about, city, country, specialty_ids, other_specialty, content_types, socials, followers, created_at, start_year, available, is_featured, featured_work_ids'
