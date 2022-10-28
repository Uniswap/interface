import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import useENSName from 'hooks/useENSName'
import AssetActivity from './AssetActivity'
import { Box } from 'nft/components/Box'
import { ActivityEventResponse, ActivityEventType } from 'nft/types'
import { buttonTextMedium } from 'nft/css/common.css'
import { useBag } from 'nft/hooks'
import { useTimeout } from 'nft/hooks/useTimeout'
import { CollectionInfoForAsset, GenieAsset, SellOrder } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
import { isAssetOwnedByUser } from 'nft/utils/isAssetOwnedByUser'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { rarityProviderLogo } from 'nft/utils/rarity'
import qs from 'query-string'
import { useEffect, useMemo, useCallback, useReducer, useState } from 'react'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { useNavigate } from 'react-router-dom'
import { VerifiedIcon } from '../icons'
import styled, { css } from 'styled-components/macro'
import InfoContainer from './InfoContainer'
import TraitsContainer from './TraitsContainer'
import rarityIcon from './rarity.svg'
import DetailsContainer from './DetailsContainer'
import { useQuery } from 'react-query'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import { putCommas } from 'nft/utils/putCommas'
import { SupportedChainId } from 'constants/chains'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { reduceFilters } from '../collection/Activity'
import * as activityStyles from 'nft/components/collection/Activity.css'

import * as styles from './AssetDetails.css'
import { shortenAddress } from 'utils'

const CollectionHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.textPrimary};
  margin-top: 28px;
`

const AssetPriceDetailsContainer = styled.div`
  margin-top: 20px;
  display: none;
  @media (max-width: 960px) {
    display: block;
  }
`

const AssetHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 36px;
  line-height: 36px;
  color: ${({ theme }) => theme.textPrimary};
  margin-top: 8px;
`

const MediaContainer = styled.div`
  display: flex;
  justify-content: center;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 780px;
`

const AddressTextLink = styled.a`
  display: inline-block;
  font-weight: 600;
  color: ${({ theme }) => theme.textTertiary};
  font-size: 16px;
  line-height: 20px;
  text-decoration: none;
  max-width: 100%;
  word-wrap: break-word;

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `opacity ${duration.medium} ${timing.ease}`};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `opacity ${duration.medium} ${timing.ease}`};
  }
`

const DescriptionText = styled.div`
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
`

const RarityWrap = styled.span`
  display: flex;
  color: ${({ theme }) => theme.textPrimary};
  padding: 2px 4px;
  border-radius: 4px;
  alignitems: center;
  gap: 20px;
`

const EmptyActivitiesContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 28px;
  line-height: 36px;
  padding-top: 56px;
  padding-bottom: 56px;
`

const Link = styled.a`
  color: ${({ theme }) => theme.accentAction};
  text-decoration: none;
  font-size: 14px;
  line-height: 16px;
  margin-top: 12px;
  cursor: pointer;

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `opacity ${duration.medium} ${timing.ease}`};
  }
`

const ActivitySelectContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 34px;

  @media (max-width: 520px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`

const FilterBox = styled.div<{ isActive?: boolean }>`
  max-width: 150;
  height: 40;
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  color: ${({ theme }) => theme.textPrimary};
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  border: ${({ isActive, theme }) => (isActive ? `1px solid ${theme.accentActive}` : undefined)};

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `opacity ${duration.medium} ${timing.ease}`};
  }
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
  [ActivityEventType.Transfer]: false,
  [ActivityEventType.CancelListing]: false,
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
  const navigate = useNavigate()
  const itemsInBag = useBag((state) => state.itemsInBag)
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])
  // const creatorEnsName = useENSName(creatorAddress)
  // const ownerEnsName = useENSName(ownerAddress)

  const [isSelected, setSelected] = useState(false)
  const [isOwned, setIsOwned] = useState(false)
  const { account: address, provider } = useWeb3React()

  const { explorer } = getChainInfoOrDefault(SupportedChainId.MAINNET)

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

  const lastSalePrice = priceData?.events ? priceData?.events[0]?.price : null
  const formattedPrice = lastSalePrice ? putCommas(formatEthPrice(lastSalePrice)).toString() : null
  const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)

  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]

      return (
        <FilterBox isActive={isActive} onClick={() => filtersDispatch({ eventType })}>
          {eventType === ActivityEventType.CancelListing
            ? 'Cancellations'
            : eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </FilterBox>
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
        '25'
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

  const rarity = asset.rarity ? asset.rarity?.providers[0].rank : undefined

  return (
    <Column>
      <MediaContainer>
        {assetMediaType === MediaType.Image ? (
          <img
            className={styles.image}
            src={asset.imageUrl}
            alt={asset.name || collection.collectionName}
            style={{ boxShadow: `0px 4px 4px 0px #00000040`, backgroundColor: 'white' }}
          />
        ) : (
          <AssetView asset={asset} mediaType={assetMediaType} dominantColor={dominantColor} />
        )}
      </MediaContainer>
      <CollectionHeader>
        {collection.collectionName} {collection.isVerified && <VerifiedIcon />}
      </CollectionHeader>
      <AssetHeader>{asset.name ? asset.name : `${asset.collectionName} #${asset.tokenId}`}</AssetHeader>
      <AssetPriceDetailsContainer>
        <AssetPriceDetails asset={asset} collection={collection} />
      </AssetPriceDetailsContainer>

      <InfoContainer
        primaryHeader="Traits"
        defaulOpen
        secondaryHeader={
          rarityProvider && rarity ? (
            <RarityWrap>
              Rarity {putCommas(rarity)} <img src={rarityIcon} width={16} alt={rarityProvider.provider} />
            </RarityWrap>
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
          <ActivitySelectContainer>
            <Filter eventType={ActivityEventType.Listing} />
            <Filter eventType={ActivityEventType.Sale} />
            <Filter eventType={ActivityEventType.Transfer} />
            <Filter eventType={ActivityEventType.CancelListing} />
          </ActivitySelectContainer>
          {eventsData && eventsData.events?.length > 0 ? (
            <AssetActivity eventsData={eventsData} />
          ) : (
            <EmptyActivitiesContainer>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                <div>No activities yet</div>
                <Link href={`#/nfts/collection/${asset.address}`}>View collection items</Link>{' '}
              </div>
            </EmptyActivitiesContainer>
          )}
        </>
      </InfoContainer>

      <InfoContainer primaryHeader="Description" secondaryHeader={null}>
        <>
          <span style={{ fontSize: 14, lineHeight: '20px' }}>By </span>
          {asset.creator && asset.creator.address && (
            <AddressTextLink href={`https://etherscan.io/address/${asset.creator.address}`} target="_blank">
              {shortenAddress(asset.creator?.address)}
            </AddressTextLink>
          )}

          <DescriptionText>{collection.collectionDescription}</DescriptionText>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" secondaryHeader={null}>
        <DetailsContainer asset={asset} collection={collection} />
      </InfoContainer>
    </Column>
  )
}
