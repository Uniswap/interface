import { fiatOnRampNavigationRef } from 'src/app/navigation/navigationRef'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLinkSaga'
import { handleTopTokensDeepLink } from 'src/features/deepLinking/handleTopTokensDeepLink'
import { parseSwapLinkWebFormatOrThrow } from 'src/features/deepLinking/parseSwapLink'
import { LinkSource } from 'src/features/deepLinking/types'
import { dismissAllModalsBeforeNavigation } from 'src/features/deepLinking/utils'
import { openModal } from 'src/features/modals/modalSlice'
import { call, put, select } from 'typed-redux-saga'
import { fromUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { BACKEND_NATIVE_CHAIN_ADDRESS_STRING } from 'uniswap/src/features/search/utils'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { WidgetType } from 'uniswap/src/types/widgets'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { selectAccounts, selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

const NFT_ITEM_SHARE_LINK_HASH_REGEX = /^(#\/)?nfts\/asset\/(0x[a-fA-F0-9]{40})\/(\d+)$/
const NFT_COLLECTION_SHARE_LINK_HASH_REGEX = /^(#\/)?nfts\/collection\/(0x[a-fA-F0-9]{40})$/
const TOKEN_SHARE_LINK_HASH_REGEX = RegExp(
  `^(#/)?(?:explore/)?tokens/([\\w\\d]*)/(0x[a-fA-F0-9]{40}|${BACKEND_NATIVE_CHAIN_ADDRESS_STRING})$`,
)
const TOP_TOKENS_LINK_CHAIN_REGEX = /^(?:explore\/)?tokens\/([\w\d]+)/
const TOP_TOKENS_LINK_REGEX = /^(?:explore\/)?tokens/
const ADDRESS_SHARE_LINK_HASH_REGEX = /^(#\/)?address\/(0x[a-fA-F0-9]{40})$/
const SWAP_LINK_HASH_REGEX = /^\/?swap(?:\?)?/
const BUY_LINK_HASH_REGEX = /^\/?buy(?:\?)?/

export function* handleUniswapAppDeepLink({
  path,
  url,
  linkSource,
}: {
  path: string
  url: string
  linkSource: LinkSource
}): Generator {
  // Handle Buy links (ex. https://app.uniswap.org/buy?value=3&currencyCode=ETH)
  if (BUY_LINK_HASH_REGEX.test(path)) {
    const urlObj = new URL(url)
    yield* call(handleBuyLink, urlObj)
    return
  }

  // Handle Swap links (ex. https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0x...)
  if (SWAP_LINK_HASH_REGEX.test(path)) {
    const urlObj = new URL(url)
    yield* call(handleSwapLink, urlObj, parseSwapLinkWebFormatOrThrow)
    return
  }

  // Handle NFT Item share (ex. https://app.uniswap.org/nfts/asset/0x.../123)
  if (NFT_ITEM_SHARE_LINK_HASH_REGEX.test(path)) {
    yield* call(handleNFTItemShare, { path, url })
    return
  }

  // Handle NFT collection share (ex. https://app.uniswap.org/nfts/collection/0x...)
  if (NFT_COLLECTION_SHARE_LINK_HASH_REGEX.test(path)) {
    yield* call(handleNFTCollectionShare, { path, url })
    return
  }

  // Handle Token share (ex. https://app.uniswap.org/tokens/ethereum/0x... or https://app.uniswap.org/explore/tokens/arbitrum/0x...)
  if (TOKEN_SHARE_LINK_HASH_REGEX.test(path)) {
    yield* call(handleTokenShare, { path, url, linkSource })
    return
  }

  // Handle Top Tokens page with or without explore and chain path:
  // ex. https://app.uniswap.org/tokens/unichain?metric=volume or https://app.uniswap.org/explore/tokens/base?metric=market_cap
  // or https://app.uniswap.org/tokens?metric=volume or https://app.uniswap.org/explore/tokens?metric=market_cap
  if (TOP_TOKENS_LINK_CHAIN_REGEX.test(path) || TOP_TOKENS_LINK_REGEX.test(path)) {
    const [, network] = path.match(TOP_TOKENS_LINK_CHAIN_REGEX) || []
    const chainId = network ? fromUniswapWebAppLink(network) : undefined

    yield* call(handleTopTokensDeepLink, { chainId, url })
    return
  }

  // Handle Address share (ex. https://app.uniswap.org/address/0x...)
  if (ADDRESS_SHARE_LINK_HASH_REGEX.test(path)) {
    yield* call(handleAddressShare, { path, url })
    return
  }
}

function* handleNFTItemShare({ path, url }: { path: string; url: string }): Generator {
  const [, , contractAddress, tokenId] = path.match(NFT_ITEM_SHARE_LINK_HASH_REGEX) || []
  if (!contractAddress || !tokenId) {
    return
  }

  yield* call(dismissAllModalsBeforeNavigation)

  yield* call(navigate, MobileScreens.NFTItem, {
    address: contractAddress,
    tokenId,
    isSpam: false,
  })
  yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
    entity: ShareableEntity.NftItem,
    url,
  })
}

function* handleNFTCollectionShare({ path, url }: { path: string; url: string }): Generator {
  const [, , contractAddress] = path.match(NFT_COLLECTION_SHARE_LINK_HASH_REGEX) || []
  if (!contractAddress) {
    return
  }

  yield* call(dismissAllModalsBeforeNavigation)

  yield* call(navigate, MobileScreens.NFTCollection, {
    collectionAddress: contractAddress,
  })
  yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
    entity: ShareableEntity.NftCollection,
    url,
  })
}

function* handleTokenShare({
  path,
  url,
  linkSource,
}: {
  path: string
  url: string
  linkSource: LinkSource
}): Generator {
  const [, , network, contractAddress] = path.match(TOKEN_SHARE_LINK_HASH_REGEX) || []
  const chainId = network && fromUniswapWebAppLink(network)

  if (!chainId || !contractAddress) {
    return
  }

  yield* call(dismissAllModalsBeforeNavigation)

  const currencyId =
    contractAddress === BACKEND_NATIVE_CHAIN_ADDRESS_STRING
      ? buildNativeCurrencyId(chainId)
      : buildCurrencyId(chainId, contractAddress)
  yield* call(navigate, MobileScreens.TokenDetails, {
    currencyId,
  })
  if (linkSource === LinkSource.Share) {
    yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.Token,
      url,
    })
  } else {
    yield* call(sendAnalyticsEvent, MobileEventName.WidgetClicked, {
      widget_type: WidgetType.TokenPrice,
      url,
    })
  }
}

function* handleAddressShare({ path, url }: { path: string; url: string }): Generator {
  const [, , accountAddress] = path.match(ADDRESS_SHARE_LINK_HASH_REGEX) || []
  if (!accountAddress) {
    return
  }
  const accounts = yield* select(selectAccounts)
  const activeAccountAddress = yield* select(selectActiveAccountAddress)
  if (accountAddress === activeAccountAddress) {
    return
  }

  const isInternal = Boolean(accounts[accountAddress])

  yield* call(dismissAllModalsBeforeNavigation)

  if (isInternal) {
    yield* put(setAccountAsActive(accountAddress))
  } else {
    yield* call(navigate, MobileScreens.ExternalProfile, {
      address: accountAddress,
    })
  }
  yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
    entity: ShareableEntity.Wallet,
    url,
  })
  return
}

function* handleBuyLink(urlObj: URL): Generator {
  const searchParams = urlObj.searchParams
  const value = searchParams.get('value')
  const currencyCode = searchParams.get('currencyCode')
  const isTokenInputMode = searchParams.get('isTokenInputMode')
  const providers = searchParams
    .get('providers')
    ?.split(',')
    .map((provider) => provider.trim())
    .filter(Boolean)
    .map((provider) => provider.toUpperCase())

  const ref = fiatOnRampNavigationRef.current
  if (!ref || !ref.isFocused()) {
    yield* call(dismissAllModalsBeforeNavigation)
  }
  yield* put(
    openModal({
      name: ModalName.FiatOnRampAggregator,
      initialState: {
        prefilledAmount: value || undefined,
        currencyCode: currencyCode || undefined,
        prefilledIsTokenInputMode: isTokenInputMode === 'true',
        providers,
      },
    }),
  )
}
