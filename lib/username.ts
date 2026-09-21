// Members log in with a username, not an email. Supabase Auth still needs
// something shaped like an email, so we map deterministically to a domain
// nobody will ever actually receive mail at. Members never see this value.
export const USER_DOMAIN = 'members.local'

export function toEmail(username: string) {
  return `${username.trim().toLowerCase()}@${USER_DOMAIN}`
}

export function fromEmail(email: string) {
  return email.split('@')[0]
}
