import { call, put } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleTopTokensDeepLink } from 'src/features/deepLinking/handleTopTokensDeepLink'
import { handleUniswapAppDeepLink } from 'src/features/deepLinking/handleUniswapAppDeepLink'
import { LinkSource } from 'src/features/deepLinking/types'
import { openModal } from 'src/features/modals/modalSlice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { BACKEND_NATIVE_CHAIN_ADDRESS_STRING } from 'uniswap/src/features/search/utils'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { WidgetType } from 'uniswap/src/types/widgets'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

const account = signerMnemonicAccount()
const SAMPLE_CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const SAMPLE_CONTRACT_ADDRESS_2 = '0xabcdef1234567890abcdef1234567890abcdef12'
const SAMPLE_TOKEN_ID = '123'
const SAMPLE_CURRENCY_ID = '1-0x1234567890abcdef1234567890abcdef12345678'
const SAMPLE_NATIVE_CURRENCY_ID = '1-ETH'

const stateWithAccounts = {
  wallet: {
    accounts: {
      [account.address]: account,
      [SAMPLE_CONTRACT_ADDRESS_2]: account,
    },
    activeAccountAddress: account.address,
  },
}

describe('handleUniswapAppDeepLink', () => {
  describe('NFT Item deep links', () => {
    it('should handle NFT item share with hash prefix', () => {
      const path = `#/nfts/asset/${SAMPLE_CONTRACT_ADDRESS}/${SAMPLE_TOKEN_ID}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            call(navigate, MobileScreens.NFTItem, {
              address: SAMPLE_CONTRACT_ADDRESS,
              tokenId: SAMPLE_TOKEN_ID,
              isSpam: false,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.NftItem,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle NFT item share without hash prefix', () => {
      const path = `nfts/asset/${SAMPLE_CONTRACT_ADDRESS}/${SAMPLE_TOKEN_ID}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            call(navigate, MobileScreens.NFTItem, {
              address: SAMPLE_CONTRACT_ADDRESS,
              tokenId: SAMPLE_TOKEN_ID,
              isSpam: false,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.NftItem,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should not handle invalid NFT item path', () => {
      const path = 'nfts/asset/invalid-address/123'
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .not.call.fn(navigate)
        .run()
    })
  })

  describe('NFT Collection deep links', () => {
    it('should handle NFT collection share with hash prefix', () => {
      const path = `#/nfts/collection/${SAMPLE_CONTRACT_ADDRESS}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            call(navigate, MobileScreens.NFTCollection, {
              collectionAddress: SAMPLE_CONTRACT_ADDRESS,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.NftCollection,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle NFT collection share without hash prefix', () => {
      const path = `nfts/collection/${SAMPLE_CONTRACT_ADDRESS}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            call(navigate, MobileScreens.NFTCollection, {
              collectionAddress: SAMPLE_CONTRACT_ADDRESS,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.NftCollection,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })
  })

  describe('Token deep links', () => {
    it('should handle token share with contract address', () => {
      const path = `tokens/ethereum/${SAMPLE_CONTRACT_ADDRESS}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [call(fromUniswapWebAppLink, 'ethereum'), UniverseChainId.Mainnet],
          [call(buildCurrencyId, UniverseChainId.Mainnet, SAMPLE_CONTRACT_ADDRESS), SAMPLE_CURRENCY_ID],
          [
            call(navigate, MobileScreens.TokenDetails, {
              currencyId: SAMPLE_CURRENCY_ID,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.Token,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle token share with native currency', () => {
      const path = `tokens/ethereum/${BACKEND_NATIVE_CHAIN_ADDRESS_STRING}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [call(fromUniswapWebAppLink, 'ethereum'), UniverseChainId.Mainnet],
          [call(buildNativeCurrencyId, UniverseChainId.Mainnet), SAMPLE_NATIVE_CURRENCY_ID],
          [
            call(navigate, MobileScreens.TokenDetails, {
              currencyId: SAMPLE_NATIVE_CURRENCY_ID,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.Token,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle widget token link', () => {
      const path = `tokens/ethereum/${SAMPLE_CONTRACT_ADDRESS}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Widget,
      })
        .provide([
          [call(fromUniswapWebAppLink, 'ethereum'), UniverseChainId.Mainnet],
          [call(buildCurrencyId, UniverseChainId.Mainnet, SAMPLE_CONTRACT_ADDRESS), SAMPLE_CURRENCY_ID],
          [
            call(navigate, MobileScreens.TokenDetails, {
              currencyId: SAMPLE_CURRENCY_ID,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.WidgetClicked, {
              widget_type: WidgetType.TokenPrice,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should throw error for token link with invalid network', () => {
      const path = `tokens/invalid/${SAMPLE_CONTRACT_ADDRESS}`
      const url = `https://app.uniswap.org/${path}`

      return expect(
        expectSaga(handleUniswapAppDeepLink, {
          path,
          url,
          linkSource: LinkSource.Share,
        }).run(),
      ).rejects.toThrow('Network "invalid" can not be mapped')
    })
  })

  describe('Top Tokens deep links', () => {
    it('should handle explore top tokens with chain', () => {
      const path = 'explore/tokens/unichain'
      const url = `https://app.uniswap.org/${path}?metric=volume`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [call(fromUniswapWebAppLink, 'unichain'), UniverseChainId.Unichain],
          [
            call(handleTopTokensDeepLink, {
              chainId: UniverseChainId.Unichain,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle top tokens with chain', () => {
      const path = 'tokens/ethereum'
      const url = `https://app.uniswap.org/${path}?metric=volume`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [call(fromUniswapWebAppLink, 'ethereum'), UniverseChainId.Mainnet],
          [
            call(handleTopTokensDeepLink, {
              chainId: UniverseChainId.Mainnet,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle explore top tokens without chain', () => {
      const path = 'explore/tokens'
      const url = `https://app.uniswap.org/${path}?metric=volume`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            call(handleTopTokensDeepLink, {
              chainId: undefined,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle top tokens without chain', () => {
      const path = 'tokens'
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            call(handleTopTokensDeepLink, {
              chainId: undefined,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })
  })

  describe('Address deep links', () => {
    it('should handle external address share', () => {
      const externalAddress = '0x1234567890abcdef1234567890abcdef12345679'
      const path = `address/${externalAddress}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .withState(stateWithAccounts)
        .provide([
          [
            call(navigate, MobileScreens.ExternalProfile, {
              address: externalAddress,
            }),
            undefined,
          ],
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.Wallet,
              url,
            }),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle internal address share by switching to that account', () => {
      const path = `address/${SAMPLE_CONTRACT_ADDRESS_2}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .withState(stateWithAccounts)
        .provide([
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.Wallet,
              url,
            }),
            undefined,
          ],
        ])
        .put(setAccountAsActive(SAMPLE_CONTRACT_ADDRESS_2))
        .run()
    })

    it('should not handle active account address', () => {
      const path = `address/${account.address}`
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .withState(stateWithAccounts)
        .provide([
          [
            call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
              entity: ShareableEntity.Wallet,
              url,
            }),
            undefined,
          ],
        ])
        .not.call.fn(navigate)
        .not.put.actionType(setAccountAsActive.type)
        .run()
    })
  })

  describe('Edge cases and invalid paths', () => {
    it('should not handle unrecognized paths', () => {
      const path = 'unknown/path'
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .not.call.fn(navigate)
        .not.call.fn(handleTopTokensDeepLink)
        .run()
    })

    it('should not handle address with invalid format', () => {
      const path = 'address/invalid-address'
      const url = `https://app.uniswap.org/${path}`

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .not.call.fn(navigate)
        .run()
    })
  })

  describe('Buy deep links', () => {
    it('should handle buy link with value and currencyCode', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?value=3&currencyCode=ETH'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: '3',
                  currencyCode: 'ETH',
                  prefilledIsTokenInputMode: false,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with only value', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?value=100'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: '100',
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: false,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with only currencyCode', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?currencyCode=USDC'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: 'USDC',
                  prefilledIsTokenInputMode: false,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with no parameters', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: false,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with isTokenInputMode=true', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?value=50&currencyCode=BTC&isTokenInputMode=true'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: '50',
                  currencyCode: 'BTC',
                  prefilledIsTokenInputMode: true,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with isTokenInputMode=false', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?value=25&currencyCode=USDT&isTokenInputMode=false'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: '25',
                  currencyCode: 'USDT',
                  prefilledIsTokenInputMode: false,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with only isTokenInputMode parameter', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?isTokenInputMode=true'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: true,
                  providers: undefined,
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with single provider', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?providers=moonpay'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: false,
                  providers: ['MOONPAY'],
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with multiple providers', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?providers=moonpay,coinbasepay,stripe'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: false,
                  providers: ['MOONPAY', 'COINBASEPAY', 'STRIPE'],
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with providers in mixed case (converted to uppercase)', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?providers=MoonPay,coinbasepay,STRIPE'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: false,
                  providers: ['MOONPAY', 'COINBASEPAY', 'STRIPE'],
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with providers and other parameters', () => {
      const path = 'buy'
      const url =
        'https://app.uniswap.org/buy?value=100&currencyCode=ETH&isTokenInputMode=true&providers=moonpay,coinbasepay'

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: '100',
                  currencyCode: 'ETH',
                  prefilledIsTokenInputMode: true,
                  providers: ['MOONPAY', 'COINBASEPAY'],
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })

    it('should handle buy link with empty providers parameter', () => {
      const path = 'buy'
      const url = 'https://app.uniswap.org/buy?providers='

      return expectSaga(handleUniswapAppDeepLink, {
        path,
        url,
        linkSource: LinkSource.Share,
      })
        .provide([
          [
            put(
              openModal({
                name: ModalName.FiatOnRampAggregator,
                initialState: {
                  prefilledAmount: undefined,
                  currencyCode: undefined,
                  prefilledIsTokenInputMode: false,
                  providers: [],
                },
              }),
            ),
            undefined,
          ],
        ])
        .run()
    })
  })
})
