import { UniverseChainId } from '@universe/chains'
import { RELATED_TOKENS_MAX_COUNT } from '@universe/data-api'
import {
  isSubjectToken,
  toRelatedTokens,
} from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/relatedTokenMappers'
import { rankedTokenToCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const subject = { chainId: UniverseChainId.Mainnet, address: UNI }

describe(rankedTokenToCardItem, () => {
  it('maps price, change and logo onto the card model', () => {
    const token = createRankedMultichainToken({ symbol: 'UNI', address: UNI, price: 7.5, priceChange1d: -2 })
    expect(rankedTokenToCardItem(token)).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: UNI,
      symbol: 'UNI',
      priceUsd: 7.5,
      pricePercentChange1d: -2,
      logoUrl: 'https://example.com/usdc.png',
    })
  })

  it('returns undefined without a supported deployment', () => {
    expect(rankedTokenToCardItem(createRankedMultichainToken({ addresses: {} }))).toBeUndefined()
  })
})

describe(isSubjectToken, () => {
  it('matches the subject case-insensitively on its chain', () => {
    const token = createRankedMultichainToken({ address: UNI.toLowerCase() })
    expect(isSubjectToken(token, subject)).toBe(true)
  })

  it('ignores the same address on another chain', () => {
    const token = createRankedMultichainToken({ addresses: { [String(UniverseChainId.Base)]: UNI } })
    expect(isSubjectToken(token, subject)).toBe(false)
  })
})

describe(toRelatedTokens, () => {
  it('drops the subject token and caps the list', () => {
    const tokens = [
      createRankedMultichainToken({ multichainId: 'mc:uni', address: UNI }),
      ...Array.from({ length: RELATED_TOKENS_MAX_COUNT + 2 }, (_, i) =>
        createRankedMultichainToken({ multichainId: `mc:${i}`, address: USDC }),
      ),
    ]
    const related = toRelatedTokens({ tokens, subject })
    expect(related).toHaveLength(RELATED_TOKENS_MAX_COUNT)
    expect(related.some((token) => token.address === UNI)).toBe(false)
  })
})
