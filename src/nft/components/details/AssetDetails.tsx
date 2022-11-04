import Resource from 'components/Tokens/TokenDetails/Resource'
import { MouseoverTooltip } from 'components/Tooltip/index'
import { Box } from 'nft/components/Box'
import { reduceFilters } from 'nft/components/collection/Activity'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { Center } from 'nft/components/Flex'
import { VerifiedIcon } from 'nft/components/icons'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import {
  ActivityEventResponse,
  ActivityEventType,
  CollectionInfoForAsset,
  GenieAsset,
  GenieCollection,
} from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { formatEthPrice } from 'nft/utils/currency'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { putCommas } from 'nft/utils/putCommas'
import { fallbackProvider, getRarityProviderLogo } from 'nft/utils/rarity'
import { useCallback, useMemo, useReducer, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery, useQuery } from 'react-query'
import { Link as RouterLink } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'

import AssetActivity from './AssetActivity'
import * as styles from './AssetDetails.css'
import DetailsContainer from './DetailsContainer'
import InfoContainer from './InfoContainer'
import TraitsContainer from './TraitsContainer'

const OpacityTransition = css`
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `opacity ${duration.medium} ${timing.ease}`};
`

const CollectionHeader = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.textPrimary};
  margin-top: 28px;
  text-decoration: none;
  ${OpacityTransition};
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
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;
  max-width: 100%;
  word-wrap: break-word;
  ${OpacityTransition};
`

const SocialsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 20px;
`

const DescriptionText = styled.div`
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
`

const RarityWrap = styled.span`
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  padding: 2px 4px;
  border-radius: 4px;
  align-items: center;
  gap: 4px;
`

const EmptyActivitiesContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 28px;
  line-height: 36px;
  padding: 56px 0px;
`

const Link = styled(RouterLink)`
  color: ${({ theme }) => theme.accentAction};
  text-decoration: none;
  font-size: 14px;
  line-height: 16px;
  margin-top: 12px;
  cursor: pointer;
  ${OpacityTransition};
`

const DefaultLink = styled(RouterLink)`
  text-decoration: none;
`

const ActivitySelectContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 34px;
  overflow-x: auto;

  // Firefox scrollbar styling
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.backgroundOutline} transparent`};

  // safari and chrome scrollbar styling
  ::-webkit-scrollbar {
    background: transparent;
    height: 4px;
  }
  ::-webkit-scrollbar-track {
    margin-top: 40px;
  }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundOutline};
    border-radius: 8px;
  }

  @media (max-width: 720px) {
    padding-bottom: 8px;
  }
`

const ContentNotAvailable = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.backgroundSurface};
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  width: 450px;
  height: 450px;
`

const FilterBox = styled.div<{ isActive?: boolean }>`
  box-sizing: border-box;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  color: ${({ theme }) => theme.textPrimary};
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  border: ${({ isActive, theme }) => (isActive ? `1px solid ${theme.accentActive}` : undefined)};
  ${OpacityTransition};
`

const ByText = styled.span`
  font-size: 14px;
  line-height: 20px;
`

const Img = styled.img`
  background-color: white;
`

const HoverImageContainer = styled.div`
  display: flex;
  margin-right: 4px;
`

const HoverContainer = styled.div`
  display: flex;
`

const ContainerText = styled.span`
  font-size: 14px;
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
  collectionStats: GenieCollection | undefined
}

export const AssetDetails = ({ asset, collection, collectionStats }: AssetDetailsProps) => {
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])

  const { rarityProvider } = useMemo(
    () =>
      asset.rarity
        ? {
            rarityProvider: asset?.rarity?.providers?.find(
              ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider
            ),
          }
        : {},
    [asset.rarity]
  )

  const assetMediaType = useMemo(() => {
    if (isAudio(asset.animationUrl ?? '')) {
      return MediaType.Audio
    } else if (isVideo(asset.animationUrl ?? '')) {
      return MediaType.Video
    }
    return MediaType.Image
  }, [asset])

  const { address: contractAddress, tokenId: token_id } = asset

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

  const lastSalePrice = priceData?.events[0]?.price ?? null
  const formattedEthprice = formatEthPrice(lastSalePrice ?? '') || 0
  const formattedPrice = lastSalePrice ? putCommas(formattedEthprice).toString() : null
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

  const {
    data: eventsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
  } = useInfiniteQuery<ActivityEventResponse>(
    [
      'collectionActivity',
      {
        contractAddress,
        activeFilters,
        token_id,
      },
    ],
    async ({ pageParam = '' }) => {
      return await ActivityFetcher(
        contractAddress,
        {
          token_id,
          eventTypes: Object.keys(activeFilters)
            .map((key) => key as ActivityEventType)
            .filter((key) => activeFilters[key]),
        },
        pageParam
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

  const rarity = asset?.rarity?.providers?.length ? asset?.rarity?.providers?.[0] : undefined
  const [showHolder, setShowHolder] = useState(false)
  const rarityProviderLogo = getRarityProviderLogo(rarity?.provider)
  const events = useMemo(
    () => (isSuccess ? eventsData?.pages.map((page) => page.events).flat() : null),
    [isSuccess, eventsData]
  )

  return (
    <Column>
      <MediaContainer>
        {asset.imageUrl === undefined || showHolder ? (
          <ContentNotAvailable>Content not available yet</ContentNotAvailable>
        ) : assetMediaType === MediaType.Image ? (
          <Img
            className={styles.image}
            src={asset.imageUrl}
            alt={asset.name || collection.collectionName}
            onError={() => setShowHolder(true)}
          />
        ) : (
          <AssetView asset={asset} mediaType={assetMediaType} dominantColor={dominantColor} />
        )}
      </MediaContainer>
      <DefaultLink to={`/nfts/collection/${asset.address}`}>
        <CollectionHeader>
          {collection.collectionName} {collectionStats?.isVerified && <VerifiedIcon />}
        </CollectionHeader>
      </DefaultLink>

      <AssetHeader>{asset.name ?? `${asset.collectionName} #${asset.tokenId}`}</AssetHeader>
      <AssetPriceDetailsContainer>
        <AssetPriceDetails asset={asset} collection={collection} />
      </AssetPriceDetailsContainer>
      <InfoContainer
        primaryHeader="Traits"
        defaultOpen
        secondaryHeader={
          rarityProvider && rarity && rarity.score ? (
            <MouseoverTooltip
              text={
                <HoverContainer>
                  <HoverImageContainer>
                    <img src={rarityProviderLogo} alt="cardLogo" width={16} />
                  </HoverImageContainer>
                  <ContainerText>
                    {collectionStats?.rarityVerified
                      ? `Verified by ${collectionStats?.name}`
                      : `Ranking by ${rarity.provider === 'Genie' ? fallbackProvider : rarity.provider}`}
                  </ContainerText>
                </HoverContainer>
              }
              placement="top"
            >
              <RarityWrap>Rarity: {putCommas(rarity.score)}</RarityWrap>
            </MouseoverTooltip>
          ) : null
        }
      >
        <TraitsContainer asset={asset} />
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
          {events && events.length > 0 ? (
            <InfiniteScroll
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              loader={
                isFetchingNextPage ? (
                  <Center>
                    <LoadingSparkle />
                  </Center>
                ) : null
              }
              dataLength={events?.length ?? 0}
              scrollableTarget="activityContainer"
            >
              <AssetActivity eventsData={{ events }} />
            </InfiniteScroll>
          ) : (
            <EmptyActivitiesContainer>
              <div>No activities yet</div>
              <Link to={`/nfts/collection/${asset.address}`}>View collection items</Link>{' '}
            </EmptyActivitiesContainer>
          )}
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Description" secondaryHeader={null}>
        <>
          <ByText>By </ByText>
          {asset?.creator && asset.creator?.address && (
            <AddressTextLink
              href={`https://etherscan.io/address/${asset.creator.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortenAddress(asset.creator.address, 2, 4)}
            </AddressTextLink>
          )}

          <DescriptionText>{collection.collectionDescription}</DescriptionText>
          <SocialsContainer>
            {collectionStats?.externalUrl && <Resource name="Website" link={`${collectionStats?.externalUrl}`} />}
            {collectionStats?.twitterUrl && (
              <Resource name="Twitter" link={`https://twitter.com/${collectionStats?.twitterUrl}`} />
            )}
            {collectionStats?.discordUrl && <Resource name="Discord" link={collectionStats?.discordUrl} />}
          </SocialsContainer>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" secondaryHeader={null}>
        <DetailsContainer asset={asset} collection={collection} />
      </InfoContainer>
    </Column>
  )
}
