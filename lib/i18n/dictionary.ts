export const dictionaries = {
  en: {
    nav: {
      today: 'Today',
      morning: 'Morning',
      evening: 'Evening',
      pastLogs: 'Past logs',
      rankings: 'Rankings',
      profile: 'Profile',
      admin: 'Admin',
    },
    common: {
      signOut: 'Sign out',
    },
  },
  ko: {
    nav: {
      today: '오늘',
      morning: '아침',
      evening: '저녁',
      pastLogs: '지난 기록',
      rankings: '순위',
      profile: '프로필',
      admin: '관리자',
    },
    common: {
      signOut: '로그아웃',
    },
  },
} as const

export type Locale = keyof typeof dictionaries
export type Dictionary = (typeof dictionaries)[Locale]

export function getDictionary(locale: string): Dictionary {
  return dictionaries[locale as Locale] ?? dictionaries.en
}
