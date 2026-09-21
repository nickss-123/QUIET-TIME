export type UserRole = 'admin' | 'member'
export type EntryKind = 'morning' | 'evening'
export type Visibility = 'private' | 'shared_with_admin'
export type Theme = 'dawn' | 'vesper' | 'cedar' | 'linen' | 'tide' | 'ink'

export interface Profile {
  id: string
  username: string
  display_name: string
  role: UserRole
  group_id: string | null
  timezone: string
  is_active: boolean
  must_change_password: boolean
  theme: Theme
  accent_color: string | null
  custom_colors: Partial<Record<'bg' | 'surface' | 'ink' | 'muted' | 'line', string>>
  locale: string | null
  avatar_path: string | null
  show_on_leaderboard: boolean
  bio: string | null
}

export interface Entry {
  id: string
  user_id: string
  entry_date: string
  kind: EntryKind
  scripture_ref: string | null
  scripture_text: string | null
  observation: string | null
  application: string | null
  prayer_points: string | null
  presence_of_god: string | null
  blessings: string | null
  growth: string | null
  struggles: string | null
  holy_spirit_conscious: string | null
  coram_deo: string | null
  one_minute_prayer: string | null
  supernatural_joy_peace: string | null
  holy_spirit_guidance_crisis: string | null
  love_endure_forgive: string | null
  grace_received: string | null
  thankful_for: string | null
  repent_of: string | null
  prayer_requests: string | null
  mood: number | null
  visibility: Visibility
  is_prayer_request: boolean
  word_count: number
  created_at: string
  updated_at: string
}

export interface ScheduleItem {
  id: string
  title: string
  image_path: string
  starts_on: string
  ends_on: string
  version: number
  is_published: boolean
  notes: string | null
}

export type ChatChannel = 'group' | 'general'

export interface ChatMessage {
  id: string
  channel: ChatChannel
  group_id: string | null
  user_id: string
  body: string | null
  image_path: string | null
  is_anonymous: boolean
  created_at: string
  profiles: { username: string; display_name: string; avatar_path: string | null } | null
}

export type DeletionStatus = 'pending' | 'approved' | 'rejected'

export interface DeletionRequest {
  id: string
  user_id: string
  entry_date: string
  reason: string | null
  status: DeletionStatus
  decided_by: string | null
  decided_at: string | null
  created_at: string
}
