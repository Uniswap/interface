import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { searchTokenToTokenSearchResult } from 'lib/utils/searchBar'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  Chain,
  ProtectionResult,
  SafetyLevel,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'

describe('searchBar', () => {
  describe('searchTokenToTokenSearchResult', () => {
    describe(`${NATIVE_CHAIN_ID}`, () => {
      it('accepts a searchToken and returns a TokenSearchResult', () => {
        const ethSearchResult: TokenSearchResult = {
          type: SearchResultType.Token,
          chainId: UniverseChainId.Mainnet,
          address: null,
          logoUrl: 'eth-logo.png',
          symbol: 'ETH',
          name: 'Ethereum',
          safetyInfo: getCurrencySafetyInfo(SafetyLevel.Verified, { attackTypes: [], result: ProtectionResult.Benign }),
          feeData: null,
        }

        expect(
          searchTokenToTokenSearchResult({
            decimals: 18,
            name: 'Ethereum',
            chain: Chain.Ethereum,
            // This is not a mistake, sometimes the standard for ETH is ERC20
            // in search results.
            standard: TokenStandard.Erc20,
            address: NATIVE_CHAIN_ID,
            symbol: 'ETH',
            chainId: UniverseChainId.Mainnet,
            // @ts-ignore
            project: {
              logoUrl: 'eth-logo.png',
              safetyLevel: SafetyLevel.Verified,
            },
            feeData: undefined,
            protectionInfo: {
              attackTypes: [],
              result: ProtectionResult.Benign,
            },
          }),
        ).toEqual(ethSearchResult)

        expect(
          searchTokenToTokenSearchResult({
            decimals: 18,
            name: 'Polygon',
            chain: Chain.Polygon,
            standard: TokenStandard.Erc20,
            address: NATIVE_CHAIN_ID,
            symbol: 'MATIC',
            chainId: UniverseChainId.Polygon,
            // @ts-ignore
            project: {
              logoUrl: 'matic-logo.png',
              safetyLevel: SafetyLevel.Verified,
            },
            feeData: undefined,
            protectionInfo: {
              attackTypes: [],
              result: ProtectionResult.Benign,
            },
          }),
        ).toEqual({
          type: SearchResultType.Token,
          chainId: UniverseChainId.Polygon,
          address: getNativeAddress(UniverseChainId.Polygon),
          logoUrl: 'matic-logo.png',
          symbol: 'MATIC',
          name: 'Polygon',
          feeData: null,
          safetyInfo: {
            tokenList: TokenList.Default,
            attackType: undefined,
            protectionResult: ProtectionResult.Benign,
          },
        } as TokenSearchResult)
      })
    })
    describe(`${TokenStandard.Erc20}`, () => {
      it('accepts a searchToken and returns a TokenSearchResult', () => {
        const tokenSearchResult: TokenSearchResult = {
          type: SearchResultType.Token,
          chainId: 1,
          address: '0x123',
          logoUrl: 'token-logo.png',
          symbol: 'ABC',
          name: 'ABC Token',
          feeData: null,
          safetyInfo: {
            tokenList: TokenList.Default,
            attackType: undefined,
            protectionResult: ProtectionResult.Benign,
          },
        }

        expect(
          searchTokenToTokenSearchResult({
            decimals: 18,
            name: 'ABC Token',
            chain: Chain.Ethereum,
            standard: TokenStandard.Erc20,
            address: '0x123',
            symbol: 'ABC',
            chainId: 1,
            // @ts-ignore
            project: {
              logoUrl: 'token-logo.png',
              safetyLevel: SafetyLevel.Verified,
            },
            feeData: undefined,
            protectionInfo: {
              attackTypes: [],
              result: ProtectionResult.Benign,
            },
          }),
        ).toEqual(tokenSearchResult)
      })
    })
  })
})
