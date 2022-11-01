import { MouseoverTooltip } from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { Center, Row } from 'nft/components/Flex'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import { ActivityEventResponse, ActivityEventType } from 'nft/types'
import { CollectionInfoForAsset, GenieAsset, GenieCollection } from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { formatEthPrice } from 'nft/utils/currency'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { putCommas } from 'nft/utils/putCommas'
import { fallbackProvider, getRarityProviderLogo } from 'nft/utils/rarity'
import { useCallback, useMemo, useReducer, useState } from 'react'
import { ExternalLink } from 'react-feather'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery, useQuery } from 'react-query'
import styled, { css } from 'styled-components/macro'

import { reduceFilters } from '../collection/Activity'
import { VerifiedIcon } from '../icons'
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

const CollectionHeader = styled.a`
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

const SocialLink = styled.a`
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;

  ${OpacityTransition};
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
  ${OpacityTransition};
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
  ${OpacityTransition};
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

  // const { explorer } = getChainInfoOrDefault(SupportedChainId.MAINNET)

  const { rarityProvider } = useMemo(
    () =>
      asset.rarity
        ? {
            rarityProvider: asset.rarity.providers.find(
              ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider
            ),
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
            .filter((key) => activeFilters[key as ActivityEventType])
            .map((key) => key as ActivityEventType),
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

  const rarity = asset.rarity ? asset.rarity?.providers[0] : undefined
  const rarityProviderLogo = getRarityProviderLogo(rarity?.provider)
  const events = useMemo(
    () => (isSuccess ? eventsData?.pages.map((page) => page.events).flat() : null),
    [isSuccess, eventsData]
  )

  return (
    <Column>
      <MediaContainer>
        {asset.imageUrl === undefined ? (
          <ContentNotAvailable>Content not available yet</ContentNotAvailable>
        ) : assetMediaType === MediaType.Image ? (
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
      <CollectionHeader href={`#/nfts/collection/${asset.address}`}>
        {collection.collectionName} {collectionStats?.isVerified && <VerifiedIcon />}
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
            <MouseoverTooltip
              text={
                <div>
                  {' '}
                  <Row>
                    <Box display="flex" marginRight="4">
                      <img src={rarityProviderLogo} alt="cardLogo" width={16} />
                    </Box>
                    <Box width="full" fontSize="14">
                      {collectionStats?.rarityVerified
                        ? `Verified by ${collectionStats?.name}`
                        : `Ranking by ${rarity.provider === 'Genie' ? fallbackProvider : rarity.provider}`}
                    </Box>
                  </Row>
                </div>
              }
              placement="top"
            >
              <RarityWrap>Rarity: {putCommas(rarity.score)}</RarityWrap>
            </MouseoverTooltip>
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
              {shortenAddress(asset.creator?.address, 2, 4)}
            </AddressTextLink>
          )}

          <DescriptionText>{collection.collectionDescription}</DescriptionText>
          <SocialsContainer>
            {collectionStats?.externalUrl && (
              <SocialLink target="_blank" href={collectionStats?.externalUrl}>
                Website <ExternalLink size={14} />
              </SocialLink>
            )}
            {collectionStats?.twitterUrl && (
              <SocialLink target="_blank" href={`https://twitter.com/${collectionStats?.twitterUrl}`}>
                Twitter <ExternalLink size={14} />
              </SocialLink>
            )}
            {collectionStats?.discordUrl && (
              <SocialLink target="_blank" href={collectionStats?.discordUrl}>
                Discord <ExternalLink size={14} />
              </SocialLink>
            )}
          </SocialsContainer>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" secondaryHeader={null}>
        <DetailsContainer asset={asset} collection={collection} />
      </InfoContainer>
    </Column>
  )
}
