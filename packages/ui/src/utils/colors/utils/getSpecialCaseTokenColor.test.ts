import { getSpecialCaseTokenColor } from 'ui/src/utils/colors/utils/getSpecialCaseTokenColor'
import { describe, expect, it } from 'vitest'

const USDC_COLOR = '#0066D9'
const CURRENT_USDC_LOGO_URL = 'https://coin-images.coingecko.com/coins/images/6319/large/USDC.png?1769615602'

describe(getSpecialCaseTokenColor, () => {
  it('matches CoinGecko special cases by stable image ID', () => {
    expect(getSpecialCaseTokenColor(CURRENT_USDC_LOGO_URL, false)).toBe(USDC_COLOR)
    expect(
      getSpecialCaseTokenColor('https://coin-images.coingecko.com/coins/images/6319/large/future-name.png?999', false),
    ).toBe(USDC_COLOR)
    expect(
      getSpecialCaseTokenColor('https://assets.coingecko.com/coins/images/6319/large/usdc-renamed.png', false),
    ).toBe(USDC_COLOR)
  })

  it('does not apply a CoinGecko special case to another image ID', () => {
    expect(
      getSpecialCaseTokenColor('https://coin-images.coingecko.com/coins/images/9999/large/USDC.png', false),
    ).toBeNull()
  })

  it('does not trust a matching image ID from another host', () => {
    expect(getSpecialCaseTokenColor('https://example.com/coins/images/6319/large/USDC.png', false)).toBeNull()
  })

  it('preserves exact URL special cases', () => {
    expect(
      getSpecialCaseTokenColor(
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        false,
      ),
    ).toBe(USDC_COLOR)
  })

  it('ignores prototype-chain keys for exact URL matching', () => {
    expect(getSpecialCaseTokenColor('constructor', false)).toBeNull()
  })
})
