import { OpacityHoverState, ScrollBarStyles } from 'components/Common/styles'
import Resource from 'components/Tokens/TokenDetails/Resource'
import { MouseoverTooltip } from 'components/Tooltip'
import { useNftActivity } from 'graphql/data/nft/NftActivity'
import styled from 'lib/styled-components'
import { reduceFilters } from 'nft/components/collection/Activity'
import AssetActivity, { LoadingAssetActivity } from 'nft/components/details/AssetActivity'
import * as styles from 'nft/components/details/AssetDetails.css'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import DetailsContainer from 'nft/components/details/DetailsContainer'
import InfoContainer from 'nft/components/details/InfoContainer'
import TraitsContainer from 'nft/components/details/TraitsContainer'
import { ActivityEventType, CollectionInfoForAsset, GenieAsset } from 'nft/types'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { useCallback, useMemo, useReducer, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Link as RouterLink } from 'react-router-dom'
import { Flex, Shine, SpinningLoader, useSporeColors } from 'ui/src'
import { NftActivityType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
  color: ${({ theme }) => theme.neutral2};
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

const DescriptionText = styled.p`
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
`

const RarityWrap = styled.span`
  display: flex;
  color: ${({ theme }) => theme.neutral2};
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
  color: ${({ theme }) => theme.neutral1};
  font-size: 28px;
  line-height: 36px;
  padding: 56px 0px;
`

const Link = styled(RouterLink)`
  color: ${({ theme }) => theme.accent1};
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
  height: 32px;
`

const ContentNotAvailable = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.surface1};
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  width: 450px;
  height: 450px;
`

const FilterBox = styled.div<{ backgroundColor: string }>`
  display: flex;
  box-sizing: border-box;
  background-color: ${({ backgroundColor }) => backgroundColor};
  font-size: 14px;
  font-weight: 535;
  line-height: 14px;
  border: 1px solid ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral1};
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
    <Flex $platform-web={{ display: 'inline-block' }} alignSelf="center">
      <audio className={styles.audioControls} controls src={animationUrl} style={{ width: '292px' }} />
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
    </Flex>
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
}

const AssetView = ({
  mediaType,
  asset,
  dominantColor,
}: {
  mediaType: MediaType
  asset: GenieAsset
  dominantColor: [number, number, number]
  // eslint-disable-next-line consistent-return
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
  }
}

interface AssetDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const AssetDetails = ({ asset, collection }: AssetDetailsProps) => {
  const { formatNumberOrString } = useFormatter()
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])

  const { rarityProvider } = useMemo(
    () =>
      asset.rarity
        ? {
            rarityProvider: asset?.rarity?.providers?.find(
              ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider,
            ),
          }
        : {},
    [asset.rarity],
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

  const { nftActivity: gqlPriceData } = useNftActivity(
    {
      activityTypes: [NftActivityType.Sale],
      address: contractAddress,
      tokenId: token_id,
    },
    1,
    'no-cache',
  )

  const weiPrice = gqlPriceData?.[0]?.price
  const formattedPrice = weiPrice
    ? formatNumberOrString({ input: parseFloat(weiPrice), type: NumberType.NFTToken })
    : undefined

  const colors = useSporeColors()

  const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)
  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]

      return (
        <FilterBox
          backgroundColor={isActive ? colors.surface1.val : colors.surface3.val}
          onClick={() => filtersDispatch({ eventType })}
        >
          {eventType === ActivityEventType.CancelListing
            ? 'Cancellations'
            : eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </FilterBox>
      )
    },
    [activeFilters, colors],
  )

  const {
    nftActivity,
    hasNext: hasNextActivity,
    loadMore: loadMoreActivities,
    loading: activitiesAreLoading,
    error: errorLoadingActivities,
  } = useNftActivity(
    {
      activityTypes: Object.keys(activeFilters)
        .map((key) => key as NftActivityType)
        .filter((key) => activeFilters[key]),
      address: contractAddress,
      tokenId: token_id,
    },
    25,
  )

  const rarity = asset?.rarity?.providers?.[0]
  const [showHolder, setShowHolder] = useState(false)

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
          data-testid="nft-details-traits"
          primaryHeader="Traits"
          defaultOpen
          secondaryHeader={
            rarityProvider && rarity && rarity.score ? (
              <MouseoverTooltip
                text={
                  <HoverContainer>
                    <HoverImageContainer>
                      <img src="/nft/svgs/gem.svg" alt="cardLogo" width={16} />
                    </HoverImageContainer>
                    <ContainerText>Ranking by Rarity Sniper</ContainerText>
                  </HoverContainer>
                }
                placement="top"
              >
                <RarityWrap>
                  Rarity: {formatNumberOrString({ input: rarity.score, type: NumberType.WholeNumber })}
                </RarityWrap>
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
        data-testid="nft-details-activity"
      >
        <>
          <ActivitySelectContainer $isHorizontalScroll>
            <Filter eventType={ActivityEventType.Listing} />
            <Filter eventType={ActivityEventType.Sale} />
            <Filter eventType={ActivityEventType.Transfer} />
            <Filter eventType={ActivityEventType.CancelListing} />
          </ActivitySelectContainer>
          {activitiesAreLoading ? (
            <LoadingAssetActivity rowCount={10} />
          ) : nftActivity && nftActivity.length > 0 ? (
            <InfiniteScroll
              next={loadMoreActivities}
              hasMore={!!hasNextActivity}
              loader={
                activitiesAreLoading && (
                  <Flex justifyContent="center" alignItems="center">
                    <Shine>
                      <SpinningLoader size={40} />
                    </Shine>
                  </Flex>
                )
              }
              dataLength={nftActivity?.length ?? 0}
              scrollableTarget="activityContainer"
            >
              <AssetActivity events={nftActivity} />
            </InfiniteScroll>
          ) : (
            <>
              {!errorLoadingActivities && nftActivity && (
                <EmptyActivitiesContainer>
                  <Flex>No activities yet</Flex>
                  <Link to={`/nfts/collection/${asset.address}`}>View collection items</Link>{' '}
                </EmptyActivitiesContainer>
              )}
            </>
          )}
        </>
      </InfoContainer>
      <InfoContainer
        primaryHeader="Description"
        defaultOpen
        secondaryHeader={null}
        data-testid="nft-details-description"
      >
        <>
          <ByText>By </ByText>
          {asset?.creator && asset.creator?.address && (
            <AddressTextLink
              href={`https://etherscan.io/address/${asset.creator.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortenAddress(asset.creator.address, 2)}
            </AddressTextLink>
          )}

          <DescriptionText data-testid="nft-details-description-text">
            {collection.collectionDescription}
          </DescriptionText>
          <SocialsContainer>
            {collection.externalUrl && <Resource name="Website" link={`${collection.externalUrl}`} />}
            {collection.twitterUrl && <Resource name="Twitter" link={`https://twitter.com/${collection.twitterUrl}`} />}
            {collection.discordUrl && <Resource name="Discord" link={collection.discordUrl} />}
          </SocialsContainer>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" defaultOpen secondaryHeader={null} data-testid="nft-details-asset-details">
        <DetailsContainer asset={asset} collection={collection} />
      </InfoContainer>
    </Column>
  )
}
