import type { PlainMessage } from '@bufbuild/protobuf'
import { TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { Token as SDKToken } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DAI, USDC, USDC_ARBITRUM, USDC_BASE, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { ETH } from 'uniswap/src/test/fixtures/lib'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomChoice } from 'uniswap/src/test/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

// Chains a randomly generated fixture may land on. Restricted to chains that round-trip through
// `toGraphQLChain`, so fixtures stay usable in tests that still cross the GraphQL boundary.
const V2_CHAIN_IDS = [
  UniverseChainId.Mainnet,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Optimism,
  UniverseChainId.Polygon,
  UniverseChainId.Base,
  UniverseChainId.Bnb,
]

type RestV2TokenOptions = {
  sdkToken: SDKToken | null
  logoUrl: string | undefined
}

/**
 * `data.v2.Token` in the shape GetToken/GetTokens return over the wire — the V2 replacement for the
 * removed GraphQL `token` fixture. Pass `sdkToken` to pin a fixture to a real token; every field it
 * does not supply is randomized.
 */
export const restV2Token = createFixture<PlainMessage<Token>, RestV2TokenOptions>({
  sdkToken: null,
  logoUrl: undefined,
})(({ sdkToken, logoUrl }) => {
  const chainId = (sdkToken?.chainId as UniverseChainId | undefined) ?? randomChoice(V2_CHAIN_IDS)
  // Natives go over the wire under the zero address, not the 0xeee… display address in currencyIds.
  const { address } = currencyIdToRestContractInput(
    buildCurrencyId(chainId, sdkToken?.address ?? faker.finance.ethereumAddress()),
  )

  return {
    chainId,
    address,
    symbol: sdkToken?.symbol ?? faker.lorem.word(),
    decimals: sdkToken?.decimals ?? faker.datatype.number({ min: 1, max: 18 }),
    name: sdkToken?.name ?? faker.lorem.word(),
    type: TokenType.ERC20,
    categoryIds: [],
    project: { descriptionTranslations: {}, logoUrl },
    safety: { isSpam: false, isVerified: true, isBlocked: false, features: [] },
  }
})

/**
 * Derived fixtures
 */

export const ethV2Token = createFixture<PlainMessage<Token>>()(() => restV2Token({ sdkToken: ETH }))
export const wethV2Token = createFixture<PlainMessage<Token>>()(() =>
  restV2Token({ sdkToken: WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet] ?? null }),
)
export const daiV2Token = createFixture<PlainMessage<Token>>()(() => restV2Token({ sdkToken: DAI }))
export const usdcV2Token = createFixture<PlainMessage<Token>>()(() => restV2Token({ sdkToken: USDC }))
export const usdcBaseV2Token = createFixture<PlainMessage<Token>>()(() => restV2Token({ sdkToken: USDC_BASE }))
export const usdcArbitrumV2Token = createFixture<PlainMessage<Token>>()(() => restV2Token({ sdkToken: USDC_ARBITRUM }))
