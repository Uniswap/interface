import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  canUnwrapCurrency,
  getCurrencyForProtocol,
  getCurrencyWithOptionalUnwrap,
  getCurrencyWithWrap,
  getTokenOrZeroAddress,
} from 'components/Liquidity/utils/currency'
import { ETH_MAINNET } from 'test-utils/constants'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const nativeCurrency = nativeOnChain(UniverseChainId.Mainnet)
const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
describe('getCurrencyWithWrap', () => {
  it('returns undefined when currency is undefined', () => {
    expect(getCurrencyWithWrap(undefined, ProtocolVersion.V2)).toBeUndefined()
  })

  it('returns token as-is for token currencies', () => {
    expect(getCurrencyWithWrap(USDT, ProtocolVersion.V2)).toBe(USDT)
    expect(getCurrencyWithWrap(USDT, ProtocolVersion.V3)).toBe(USDT)
    expect(getCurrencyWithWrap(USDT, ProtocolVersion.V4)).toBe(USDT)

    expect(getCurrencyWithWrap(WETH, ProtocolVersion.V2)).toBe(WETH)
    expect(getCurrencyWithWrap(WETH, ProtocolVersion.V3)).toBe(WETH)
    expect(getCurrencyWithWrap(WETH, ProtocolVersion.V4)).toBe(WETH)
  })

  it('returns wrapped version of native currency for v2/v3 and native for v4', () => {
    expect(getCurrencyWithWrap(nativeCurrency, ProtocolVersion.V2)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyWithWrap(nativeCurrency, ProtocolVersion.V3)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyWithWrap(nativeCurrency, ProtocolVersion.V4)).toBe(nativeCurrency)
  })
})

describe('getCurrencyWithOptionalUnwrap', () => {
  it('never unwraps when shouldUnwrap is false', () => {
    expect(getCurrencyWithOptionalUnwrap({ currency: USDT, shouldUnwrap: true })).toBe(USDT)
    expect(getCurrencyWithOptionalUnwrap({ currency: WETH, shouldUnwrap: true })).toBe(
      nativeOnChain(UniverseChainId.Mainnet),
    )
    expect(getCurrencyWithOptionalUnwrap({ currency: ETH_MAINNET, shouldUnwrap: true })).toBe(ETH_MAINNET)
  })

  it('unwraps when shouldUnwrap is true and the currency is wrappedNative', () => {
    expect(getCurrencyWithOptionalUnwrap({ currency: USDT, shouldUnwrap: false })).toBe(USDT)
    expect(getCurrencyWithOptionalUnwrap({ currency: WETH, shouldUnwrap: false })).toBe(WETH)
    expect(getCurrencyWithOptionalUnwrap({ currency: ETH_MAINNET, shouldUnwrap: false })).toBe(ETH_MAINNET)
  })
})

describe('getTokenOrZeroAddress', () => {
  it('returns undefined when currency is undefined', () => {
    expect(getTokenOrZeroAddress(undefined)).toBeUndefined()
  })

  it('returns token address for token currencies', () => {
    expect(getTokenOrZeroAddress(USDT)).toBe(USDT.address)
    expect(getTokenOrZeroAddress(WETH)).toBe(WETH.address)
  })

  it('returns wrapped token address for native currency in V2/V3', () => {
    expect(getTokenOrZeroAddress(nativeCurrency)).toBe(ZERO_ADDRESS)
  })

  it('returns native currency address for native currency on Celo', () => {
    expect(getTokenOrZeroAddress(nativeOnChain(UniverseChainId.Celo))).toBe(
      getChainInfo(UniverseChainId.Celo).nativeCurrency.address,
    )
  })
})

describe('getCurrencyForProtocol', () => {
  it('returns undefined when currency is undefined', () => {
    expect(getCurrencyForProtocol(undefined, ProtocolVersion.V2)).toBeUndefined()
  })

  it('returns token as-is for token currencies', () => {
    expect(getCurrencyForProtocol(USDT, ProtocolVersion.V2)).toBe(USDT)
    expect(getCurrencyForProtocol(USDT, ProtocolVersion.V3)).toBe(USDT)
    expect(getCurrencyForProtocol(USDT, ProtocolVersion.V4)).toBe(USDT)
  })

  it('returns native token for wrapped native for v4 and as is for v2/v3', () => {
    expect(getCurrencyForProtocol(WETH, ProtocolVersion.V2)).toBe(WETH)
    expect(getCurrencyForProtocol(WETH, ProtocolVersion.V3)).toBe(WETH)
    expect(getCurrencyForProtocol(WETH, ProtocolVersion.V4)).toBe(nativeCurrency)
  })

  it('returns wrapped version of native currency for v2/v3 and native for v4', () => {
    expect(getCurrencyForProtocol(nativeCurrency, ProtocolVersion.V2)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyForProtocol(nativeCurrency, ProtocolVersion.V3)).toBe(nativeCurrency.wrapped)
    expect(getCurrencyForProtocol(nativeCurrency, ProtocolVersion.V4)).toBe(nativeCurrency)
  })
})

describe('canUnwrapCurrency', () => {
  it('returns false when currency is undefined', () => {
    expect(canUnwrapCurrency(undefined, ProtocolVersion.V2)).toBe(false)
    expect(canUnwrapCurrency(undefined, ProtocolVersion.V3)).toBe(false)
    expect(canUnwrapCurrency(undefined, ProtocolVersion.V4)).toBe(false)
  })

  it('never unwraps for v4', () => {
    expect(canUnwrapCurrency(USDT, ProtocolVersion.V4)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V4)).toBe(false)
    expect(canUnwrapCurrency(ETH_MAINNET, ProtocolVersion.V4)).toBe(false)
  })

  it('returns true for the wrapped native token on v3', () => {
    expect(canUnwrapCurrency(USDT, ProtocolVersion.V3)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V3)).toBe(true)
    expect(canUnwrapCurrency(ETH_MAINNET, ProtocolVersion.V3)).toBe(false)
  })

  it('returns true for the wrapped native currency for v2', () => {
    expect(canUnwrapCurrency(USDT, ProtocolVersion.V2)).toBe(false)
    expect(canUnwrapCurrency(WETH, ProtocolVersion.V2)).toBe(true)
    expect(canUnwrapCurrency(ETH_MAINNET, ProtocolVersion.V2)).toBe(false)
  })
})
