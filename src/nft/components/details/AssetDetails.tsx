import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import useENSName from 'hooks/useENSName'
import AssetActivity from './AssetActivity'
import { Box } from 'nft/components/Box'
import { ActivityEventResponse, ActivityEventType } from 'nft/types'
import { buttonTextMedium } from 'nft/css/common.css'
import { useBag } from 'nft/hooks'
import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { formatEthPrice } from 'nft/utils/currency'
import { isAssetOwnedByUser } from 'nft/utils/isAssetOwnedByUser'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { rarityProviderLogo } from 'nft/utils/rarity'
import qs from 'query-string'
import { useEffect, useMemo, useCallback, useReducer, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSpring } from 'react-spring'
import { VerifiedIcon } from '../icons'
import styled from 'styled-components/macro'
import InfoContainer from './InfoContainer'
import TraitsContainer from './TraitsContainer'
import rarityIcon from './rarity.svg'
import DetailsContainer from './DetailsContainer'
import { useQuery } from 'react-query'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import { putCommas } from 'nft/utils/putCommas'
import { reduceFilters } from '../collection/Activity'
import * as activityStyles from 'nft/components/collection/Activity.css'

import * as styles from './AssetDetails.css'

const CollectionHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.textPrimary};
`

const AssetHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 36px;
  line-height: 36px;
  color: ${({ theme }) => theme.textPrimary};
`

const MediaContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
  margin-bottom: 28px;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 780px;
`

const AddressText = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.textTertiary};
  font-size: 16px;
  line-height: 20px;
`

const DescriptionText = styled.div`
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
`

const AudioPlayer = ({
  imageUrl,
  animationUrl,
  name,
  collectionName,
  dominantColor,
}: GenieAsset & { dominantColor: [number, number, number] }) => {
  return (
    <Box position="relative" display="inline-block" alignSelf="center">
      <Box as="audio" className={styles.audioControls} width="292" controls src={animationUrl} />
      <img
        className={styles.image}
        src={imageUrl}
        alt={name || collectionName}
        style={{
          ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)`,
          minWidth: '300px',
          minHeight: '300px',
        }}
      />
    </Box>
  )
}

const initialFilterState = {
  [ActivityEventType.Listing]: true,
  [ActivityEventType.Sale]: true,
  [ActivityEventType.Transfer]: true,
  [ActivityEventType.CancelListing]: true,
}

const AssetView = ({
  mediaType,
  asset,
  dominantColor,
}: {
  mediaType: 'image' | 'video' | 'audio'
  asset: GenieAsset
  dominantColor: [number, number, number]
}) => {
  const style = { ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }

  switch (mediaType) {
    case 'video':
      return <video src={asset.animationUrl} className={styles.image} autoPlay controls muted loop style={style} />
    case 'image':
      return (
        <img className={styles.image} src={asset.imageUrl} alt={asset.name || asset.collectionName} style={style} />
      )
    case 'audio':
      return <AudioPlayer {...asset} dominantColor={dominantColor} />
  }
}

enum MediaType {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
}

interface AssetDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const AssetDetails = ({ asset, collection }: AssetDetailsProps) => {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const addAssetToBag = useBag((state) => state.addAssetToBag)
  const removeAssetFromBag = useBag((state) => state.removeAssetFromBag)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const bagExpanded = useBag((state) => state.bagExpanded)
  const [creatorAddress, setCreatorAddress] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])
  const creatorEnsName = useENSName(creatorAddress)
  const ownerEnsName = useENSName(ownerAddress)
  const parsed = qs.parse(search)
  const { gridWidthOffset } = useSpring({
    gridWidthOffset: bagExpanded ? 324 : 0,
  })
  const [showTraits, setShowTraits] = useState(true)
  const [isSelected, setSelected] = useState(false)
  const [isOwned, setIsOwned] = useState(false)
  const { account: address, provider } = useWeb3React()

  const { rarityProvider, rarityLogo } = useMemo(
    () =>
      asset.rarity
        ? {
            rarityProvider: asset.rarity.providers.find(
              ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider
            ),
            rarityLogo: rarityProviderLogo[asset.rarity.primaryProvider] || '',
          }
        : {},
    [asset.rarity]
  )

  const assetMediaType = useMemo(() => {
    if (isAudio(asset.animationUrl)) {
      return MediaType.Audio
    } else if (isVideo(asset.animationUrl)) {
      return MediaType.Video
    }
    return MediaType.Image
  }, [asset])

  const contractAddress = asset.address
  const token_id = asset.tokenId

  const { data: priceData } = useQuery<ActivityEventResponse>(
    [
      'collectionActivity',
      {
        contractAddress,
      },
    ],
    async ({ pageParam = '' }) => {
      return await ActivityFetcher(
        contractAddress,
        {
          token_id,
          eventTypes: [ActivityEventType.Sale],
        },
        pageParam,
        '1'
      )
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.events?.length === 25 ? lastPage.cursor : undefined
      },
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const lastSalePrice = priceData?.events ? priceData?.events[0].price : null
  const formattedPrice = lastSalePrice ? putCommas(formatEthPrice(lastSalePrice)).toString() : null
  const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)

  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]

      return (
        <Box
          className={clsx(activityStyles.filter, isActive && activityStyles.activeFilter)}
          onClick={() => filtersDispatch({ eventType })}
          style={{ maxWidth: 150, height: 40, boxSizing: 'border-box' }}
        >
          {eventType === ActivityEventType.CancelListing
            ? 'Cancellation'
            : eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </Box>
      )
    },
    [activeFilters]
  )

  const { data: eventsData } = useQuery<ActivityEventResponse>(
    [
      'collectionActivity',
      {
        contractAddress,
        activeFilters,
      },
    ],
    async ({ pageParam = '' }) => {
      return await ActivityFetcher(
        contractAddress,
        {
          token_id,
          eventTypes: Object.keys(activeFilters)
            .filter((key) => activeFilters[key as ActivityEventType])
            .map((key) => key as ActivityEventType),
        },
        pageParam,
        '5'
      )
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.events?.length === 25 ? lastPage.cursor : undefined
      },
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  // useEffect(() => {
  //   if (asset.creator) setCreatorAddress(asset.creator.address)
  //   if (asset.owner) setOwnerAddress(asset.owner)
  // }, [asset])

  useEffect(() => {
    setSelected(
      !!itemsInBag.find((item) => item.asset.tokenId === asset.tokenId && item.asset.address === asset.address)
    )
  }, [asset, itemsInBag])

  useEffect(() => {
    if (provider) {
      isAssetOwnedByUser({
        tokenId: asset.tokenId,
        userAddress: address || '',
        assetAddress: asset.address,
        tokenType: asset.tokenType,
        provider,
      }).then(setIsOwned)
    }
  }, [asset, address, provider])

  // console.log(asset)
  // console.log(collection)

  return (
    <Column>
      <CollectionHeader>
        {collection.collectionName} {collection.isVerified && <VerifiedIcon />}
      </CollectionHeader>
      <AssetHeader>{asset.name ? asset.name : `${asset.collectionName} #${asset.tokenId}`}</AssetHeader>
      <MediaContainer>
        {assetMediaType === MediaType.Image ? (
          <img
            className={styles.image}
            src={asset.imageUrl}
            alt={asset.name || collection.collectionName}
            style={{ ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }}
          />
        ) : (
          <AssetView asset={asset} mediaType={assetMediaType} dominantColor={dominantColor} />
        )}
      </MediaContainer>

      <InfoContainer
        primaryHeader="Traits"
        secondaryHeader={
          rarityProvider ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              Rarity <img src={rarityIcon} width={16} alt={rarityProvider.provider} />
            </span>
          ) : null
        }
      >
        <TraitsContainer asset={asset} collection={collection} />
      </InfoContainer>
      <InfoContainer
        primaryHeader="Activity"
        secondaryHeader={formattedPrice ? `Last Sale: ${formattedPrice} ETH` : undefined}
      >
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: 34 }}>
            <Filter eventType={ActivityEventType.Listing} />
            <Filter eventType={ActivityEventType.Sale} />
            <Filter eventType={ActivityEventType.Transfer} />
            <Filter eventType={ActivityEventType.CancelListing} />
          </div>

          <AssetActivity eventsData={eventsData} />
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Description" secondaryHeader={null}>
        <>
          <div>
            By: <AddressText className={buttonTextMedium}>{shortenAddress(asset.creator)}</AddressText>
          </div>
          <DescriptionText>{collection.collectionDescription}</DescriptionText>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" secondaryHeader={null}>
        <>
          <DetailsContainer asset={asset} collection={collection} />
        </>
      </InfoContainer>
    </Column>
  )
}
