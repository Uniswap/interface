import { OpacityHoverState, ScrollBarStyles } from 'components/Common'
import Resource from 'components/Tokens/TokenDetails/Resource'
import { MouseoverTooltip } from 'components/Tooltip/index'
import { Box } from 'nft/components/Box'
import { reduceFilters } from 'nft/components/collection/Activity'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { Center } from 'nft/components/Flex'
import { themeVars, vars } from 'nft/css/sprinkles.css'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import { ActivityEventResponse, ActivityEventType, CollectionInfoForAsset, GenieAsset } from 'nft/types'
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
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'

import AssetActivity, { LoadingAssetActivity } from './AssetActivity'
import * as styles from './AssetDetails.css'
import DetailsContainer from './DetailsContainer'
import InfoContainer from './InfoContainer'
import TraitsContainer from './TraitsContainer'

const AssetPriceDetailsContainer = styled.div`
  margin-top: 20px;
  display: none;
  @media (max-width: 960px) {
    display: block;
  }
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
  ${OpacityHoverState};
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
  ${OpacityHoverState};
`

const ActivitySelectContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 34px;
  overflow-x: auto;
  ${ScrollBarStyles}

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

const FilterBox = styled.div<{ backgroundColor: string }>`
  box-sizing: border-box;
  background-color: ${({ backgroundColor }) => backgroundColor};
  font-size: 14px;
  font-weight: 600;
  line-height: 14px;
  color: ${({ theme }) => theme.textPrimary};
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  box-sizing: border-box;
  ${OpacityHoverState};
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

enum MediaType {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
  Embed = 'embed',
}

const AssetView = ({
  mediaType,
  asset,
  dominantColor,
}: {
  mediaType: MediaType
  asset: GenieAsset
  dominantColor: [number, number, number]
}) => {
  const style = { ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }

  switch (mediaType) {
    case MediaType.Video:
      return <video src={asset.animationUrl} className={styles.image} autoPlay controls muted loop style={style} />
    case MediaType.Image:
      return (
        <img className={styles.image} src={asset.imageUrl} alt={asset.name || asset.collectionName} style={style} />
      )
    case MediaType.Audio:
      return <AudioPlayer {...asset} dominantColor={dominantColor} />
    case MediaType.Embed:
      return (
        <div className={styles.embedContainer}>
          <iframe
            title={asset.name ?? `${asset.collectionName} #${asset.tokenId}`}
            src={asset.animationUrl}
            className={styles.embed}
            style={style}
            frameBorder={0}
            height="100%"
            width="100%"
            sandbox="allow-scripts"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
  }
}

interface AssetDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const AssetDetails = ({ asset, collection }: AssetDetailsProps) => {
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
    } else if (asset.animationUrl !== undefined) {
      return MediaType.Embed
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
      const isDarkMode = useIsDarkMode()

      return (
        <FilterBox
          backgroundColor={
            isActive ? (isDarkMode ? vars.color.gray500 : vars.color.gray200) : themeVars.colors.backgroundInteractive
          }
          onClick={() => filtersDispatch({ eventType })}
        >
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
    isLoading: isActivityLoading,
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
      <AssetPriceDetailsContainer>
        <AssetPriceDetails asset={asset} collection={collection} />
      </AssetPriceDetailsContainer>
      {asset.traits && (
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
                      {`Ranking by ${rarity.provider === 'Genie' ? fallbackProvider : rarity.provider}`}
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
      )}
      <InfoContainer
        primaryHeader="Activity"
        defaultOpen
        secondaryHeader={formattedPrice ? `Last Sale: ${formattedPrice} ETH` : undefined}
      >
        <>
          <ActivitySelectContainer $isHorizontalScroll>
            <Filter eventType={ActivityEventType.Listing} />
            <Filter eventType={ActivityEventType.Sale} />
            <Filter eventType={ActivityEventType.Transfer} />
            <Filter eventType={ActivityEventType.CancelListing} />
          </ActivitySelectContainer>
          {isActivityLoading && <LoadingAssetActivity rowCount={10} />}
          {events && events.length > 0 ? (
            <InfiniteScroll
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              loader={
                isFetchingNextPage && (
                  <Center>
                    <LoadingSparkle />
                  </Center>
                )
              }
              dataLength={events?.length ?? 0}
              scrollableTarget="activityContainer"
            >
              <AssetActivity eventsData={{ events }} />
            </InfiniteScroll>
          ) : (
            <>
              {!isActivityLoading && (
                <EmptyActivitiesContainer>
                  <div>No activities yet</div>
                  <Link to={`/nfts/collection/${asset.address}`}>View collection items</Link>{' '}
                </EmptyActivitiesContainer>
              )}
            </>
          )}
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Description" defaultOpen secondaryHeader={null}>
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
            {collection.externalUrl && <Resource name="Website" link={`${collection.externalUrl}`} />}
            {collection.twitterUrl && <Resource name="Twitter" link={`https://twitter.com/${collection.twitterUrl}`} />}
            {collection.discordUrl && <Resource name="Discord" link={collection.discordUrl} />}
          </SocialsContainer>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" defaultOpen secondaryHeader={null}>
        <DetailsContainer asset={asset} collection={collection} />
      </InfoContainer>
    </Column>
  )
}
