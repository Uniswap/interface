import {
  SquareCryptopunksMarketplaceIcon,
  SquareEnsVisionMarketplaceIcon,
  SquareFoundationMarketplaceIcon,
  SquareGemMarketplaceIcon,
  SquareLooksBlurMarketplaceIcon,
  SquareLooksRareMarketplaceIcon,
  SquareLooksX2Y2MarketplaceIcon,
  SquareNft20MarketplaceIcon,
  SquareNftXMarketplaceIcon,
  SquareOpenSeaMarketplaceIcon,
  SquareRaribleMarketplaceIcon,
  SquareSudoSwapMarketplaceIcon,
  SquareZoraMarketplaceIcon,
} from 'nft/components/icons'
import { DetailsOrigin, GenieAsset, Listing, Markets, Trait, UpdatedGenieAsset, WalletAsset } from 'nft/types'
import qs from 'qs'
import { v4 as uuidv4 } from 'uuid'

export function getRarityStatus(
  rarityStatusCache: Map<string, boolean>,
  id: string,
  assets?: (GenieAsset | undefined)[]
) {
  if (rarityStatusCache.has(id)) {
    return rarityStatusCache.get(id)
  }
  const hasRarity = assets && Array.from(assets).reduce((reducer, asset) => !!(reducer || asset?.rarity), false)

  if (hasRarity) {
    rarityStatusCache.set(id, hasRarity)
  }

  return hasRarity
}

export const getAssetHref = (asset: GenieAsset | WalletAsset, origin?: DetailsOrigin) => {
  const address =
    (asset as GenieAsset).address !== undefined
      ? (asset as GenieAsset).address
      : (asset as WalletAsset).asset_contract.address
  return `/nfts/asset/${address}/${asset.tokenId}${origin ? `?origin=${origin}` : ''}`
}

export const getMarketplaceIcon = (marketplace: string, size: string | number = '16') => {
  switch (marketplace.toLowerCase()) {
    case Markets.Opensea:
      return <SquareOpenSeaMarketplaceIcon width={size} height={size} />
    case Markets.LooksRare:
      return <SquareLooksRareMarketplaceIcon width={size} height={size} />
    case Markets.X2Y2:
      return <SquareLooksX2Y2MarketplaceIcon width={size} height={size} gradientId={uuidv4()} />
    case Markets.Blur:
      return <SquareLooksBlurMarketplaceIcon width={size} height={size} />
    case Markets.Sudoswap:
      return <SquareSudoSwapMarketplaceIcon width={size} height={size} />
    case Markets.NFTX:
      return <SquareNftXMarketplaceIcon width={size} height={size} gradientId={uuidv4()} />
    case Markets.Gem:
      return <SquareGemMarketplaceIcon width={size} height={size} gradientId={uuidv4()} />
    case Markets.Zora:
      return <SquareZoraMarketplaceIcon width={size} height={size} gradientId={uuidv4()} />
    case Markets.Ensvision:
      return <SquareEnsVisionMarketplaceIcon width={size} height={size} />
    case Markets.Cryptopunks:
    case 'larvalabs':
      return <SquareCryptopunksMarketplaceIcon width={size} height={size} />
    case Markets.Rarible:
      return <SquareRaribleMarketplaceIcon width={size} height={size} />
    case Markets.Foundation:
      return <SquareFoundationMarketplaceIcon width={size} height={size} />
    case Markets.NFT20:
      return <SquareNft20MarketplaceIcon width={size} height={size} />
    default:
      return null
  }
}

export const generateTweetForAsset = (asset: GenieAsset): string => {
  return `https://twitter.com/intent/tweet?text=Check%20out%20${
    asset.name ? encodeURIComponent(asset.name) : `${asset.collectionName}%20%23${asset.tokenId}`
  }%20(${asset.collectionName})%20https://app.uniswap.org/%23/nfts/asset/${asset.address}/${
    asset.tokenId
  }%20via%20@uniswap`
}

export const generateTweetForPurchase = (assets: UpdatedGenieAsset[], txHashUrl: string): string => {
  const multipleCollections = assets.length > 0 && assets.some((asset) => asset.address !== assets[0].address)
  const tweetText = `I just purchased ${
    multipleCollections ? `${assets.length} NFTs` : `${assets.length} ${assets[0].collectionName ?? 'NFT'}`
  } with @Uniswap 🦄\n\nhttps://app.uniswap.org/#/nfts/collection/0x60bb1e2aa1c9acafb4d34f71585d7e959f387769\n${txHashUrl}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
}

function getMinListingPrice(listings: Listing[]): number {
  return Math.min(...listings.map((listing) => listing.price ?? 0)) ?? 0
}

function mapAssetsToCollections(assets: WalletAsset[]): { collection: string; items: string[] }[] {
  const collections = assets.map((asset) => asset.collection?.twitterUrl ?? asset.collection?.name ?? '')
  const uniqueCollections = [...new Set(collections)]
  return uniqueCollections.map((collection) => {
    return {
      collection,
      items: assets
        .filter((asset) => asset.collection?.twitterUrl === collection || asset.collection?.name === collection)
        .map((asset) => asset.name ?? ''),
    }
  })
}

export const generateTweetForList = (assets: WalletAsset[]): string => {
  const tweetText =
    assets.length == 1
      ? `I just listed ${
          assets[0].collection?.twitterUrl
            ? `${assets[0].collection?.twitterUrl} `
            : `${assets[0].collection?.name} ` ?? ''
        }${assets[0].name} for ${getMinListingPrice(assets[0].newListings ?? [])} ETH on ${assets[0].marketplaces
          ?.map((market) => market.name)
          .join(', ')}. Buy it on @Uniswap at https://app.uniswap.org/#${getAssetHref(assets[0])}`
      : `I just listed ${
          assets.length
        } items on @Uniswap at https://app.uniswap.org/#/nfts/profile\n\nCollections: ${mapAssetsToCollections(assets)
          .map(({ collection, items }) => `${collection} ${items.map((item) => item).join(', ')}`)
          .join(', ')} \n\nMarketplaces: ${assets[0].marketplaces?.map((market) => market.name).join(', ')}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
}

export function getLinkForTrait(trait: Trait, collectionAddress: string): string {
  const params = qs.stringify(
    { traits: [`("${trait.trait_type}","${trait.trait_value}")`] },
    {
      arrayFormat: 'comma',
    }
  )

  return `/nfts/collection/${collectionAddress}?${params}`
}
