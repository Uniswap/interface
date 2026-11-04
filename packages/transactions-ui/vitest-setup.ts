import { vi } from 'vitest'

// Views call t() with keys; tests assert on the keys, so echo them back with {{}} interpolation applied.
const mockT = (key: string, options?: Record<string, unknown>): string => {
  let result = key
  if (options && typeof options === 'object') {
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v))
    })
  }
  return result
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'en', changeLanguage: vi.fn(), resolvedLanguage: 'en' },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))
