import { TokenSortMethod } from '~/components/Tokens/constants'
import { getTokenSortMethodLabel } from '~/pages/Explore/tables/Tokens/TokenTableHeader'

const TRANSLATIONS: Record<string, string> = {
  'common.volume': 'Volume',
}

function t(key: string): string {
  return TRANSLATIONS[key] ?? key
}

describe('getTokenSortMethodLabel', () => {
  it('labels the popular volume column without a fixed timeframe', () => {
    expect(getTokenSortMethodLabel({ t, category: TokenSortMethod.VOLUME })).toBe('Volume')
  })
})
