import type zhDict from './zh.json'

export type Dictionary = typeof zhDict
export type Locale = 'zh' | 'en'

export const locales: Locale[] = ['zh', 'en']
export const defaultLocale: Locale = 'zh'

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  zh: () => import('./zh.json').then((m) => m.default as Dictionary),
  en: () => import('./en.json').then((m) => m.default as Dictionary),
}

export async function getDictionary(locale: string): Promise<Dictionary> {
  const safeLocale = (locales as string[]).includes(locale)
    ? (locale as Locale)
    : defaultLocale
  return dictionaries[safeLocale]()
}

export function isValidLocale(locale: string): locale is Locale {
  return (locales as string[]).includes(locale)
}
