import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  CHAIN_SEARCH_PARAM,
  getChainFilterFromSearchParams,
  withChainSearchParam,
} from '~/utils/params/chainQueryParam'

describe('getChainFilterFromSearchParams', () => {
  it('returns parsed chain when valid', () => {
    const params = new URLSearchParams(`${CHAIN_SEARCH_PARAM}=ethereum`)
    expect(getChainFilterFromSearchParams(params)).toEqual({
      chainUrlParam: 'ethereum',
      chainId: UniverseChainId.Mainnet,
    })
  })

  it('returns empty when param missing', () => {
    expect(getChainFilterFromSearchParams(new URLSearchParams())).toEqual({})
  })

  it('returns empty when param invalid', () => {
    const params = new URLSearchParams(`${CHAIN_SEARCH_PARAM}=not-a-chain`)
    expect(getChainFilterFromSearchParams(params)).toEqual({})
  })
})

describe('withChainSearchParam', () => {
  it('sets chain slug', () => {
    const base = new URLSearchParams('foo=1')
    const next = withChainSearchParam(base, UniverseChainId.Base)
    expect(next.get('foo')).toBe('1')
    expect(next.get(CHAIN_SEARCH_PARAM)).toBe('base')
  })

  it('sets megaeth chain slug', () => {
    const base = new URLSearchParams('foo=1')
    const next = withChainSearchParam(base, UniverseChainId.MegaETH)
    expect(next.get('foo')).toBe('1')
    expect(next.get(CHAIN_SEARCH_PARAM)).toBe('megaeth')
  })

  it('removes chain when undefined', () => {
    const base = new URLSearchParams(`${CHAIN_SEARCH_PARAM}=base&foo=1`)
    const next = withChainSearchParam(base, undefined)
    expect(next.has(CHAIN_SEARCH_PARAM)).toBe(false)
    expect(next.get('foo')).toBe('1')
  })
})
