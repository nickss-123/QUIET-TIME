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
