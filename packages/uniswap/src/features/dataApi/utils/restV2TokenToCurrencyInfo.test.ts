import type { PlainMessage } from '@bufbuild/protobuf'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'

const baseToken: PlainMessage<Token> = {
  chainId: UniverseChainId.Mainnet,
  address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  symbol: 'UNI',
  decimals: 18,
  name: 'Uniswap',
  type: 2, // ERC20
  price: undefined,
  safety: {
    isSpam: false,
    isVerified: true,
    isBlocked: false,
    verdict: undefined,
    features: [],
  },
  fees: undefined,
  project: {
    description: undefined,
    descriptionTranslations: {},
    homepageUrl: undefined,
    twitterName: undefined,
    logoUrl: 'https://example.com/uni.png',
  },
  multichain: undefined,
}

const multichainToken: PlainMessage<Token> = {
  ...baseToken,
  multichain: { id: 'uni-multichain-id', addresses: { '1': baseToken.address, '42161': '0xabc' } },
}

describe(restV2TokenToCurrencyInfo, () => {
  it('returns formatted CurrencyInfo for a verified token', () => {
    const result = restV2TokenToCurrencyInfo(baseToken)

    expect(result).toEqual({
      currency: buildCurrency({
        chainId: baseToken.chainId,
        address: baseToken.address,
        decimals: baseToken.decimals,
        symbol: baseToken.symbol,
        name: baseToken.name,
      }),
      currencyId: `${baseToken.chainId}-${baseToken.address}`,
      logoUrl: baseToken.project?.logoUrl,
      isSpam: false,
      isBridged: false,
      bridgedWithdrawalInfo: undefined,
      projectId: undefined,
      safetyInfo: {
        tokenList: TokenList.Default,
        attackType: undefined,
        protectionResult: GraphQLApi.ProtectionResult.Unknown,
        blockaidFees: undefined,
      },
    })
  })

  it('sets projectId from multichain.id when the token has a multichain group', () => {
    const result = restV2TokenToCurrencyInfo(multichainToken)

    expect(result?.projectId).toBe('uni-multichain-id')
  })

  it('leaves projectId undefined when the token has no multichain group', () => {
    const result = restV2TokenToCurrencyInfo(baseToken)

    expect(result?.projectId).toBeUndefined()
  })

  it('marks token as Blocked when safety.isBlocked is true', () => {
    const result = restV2TokenToCurrencyInfo({
      ...baseToken,
      safety: { ...baseToken.safety!, isVerified: false, isBlocked: true },
    })

    expect(result?.safetyInfo?.tokenList).toEqual(TokenList.Blocked)
  })

  it('defaults to NonDefault and not spam when safety is missing', () => {
    const result = restV2TokenToCurrencyInfo({ ...baseToken, safety: undefined })

    expect(result?.safetyInfo?.tokenList).toEqual(TokenList.NonDefault)
    expect(result?.isSpam).toBe(false)
  })

  it('maps fees.buyFee/sellFee to safetyInfo.blockaidFees as percent', () => {
    const result = restV2TokenToCurrencyInfo({
      ...baseToken,
      fees: { buyFee: 0.05, sellFee: 0.1, transferFee: undefined },
    })

    expect(result?.safetyInfo?.blockaidFees).toEqual({
      buyFeePercent: 5,
      sellFeePercent: 10,
    })
  })

  it('leaves blockaidFees undefined when fees is missing', () => {
    const result = restV2TokenToCurrencyInfo({ ...baseToken, fees: undefined })

    expect(result?.safetyInfo?.blockaidFees).toBeUndefined()
  })

  it('returns undefined if currency is invalid', () => {
    const result = restV2TokenToCurrencyInfo({ ...baseToken, decimals: undefined as unknown as number })

    expect(result).toBeUndefined()
  })
})
