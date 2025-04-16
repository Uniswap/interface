import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled, { css } from 'lib/styled-components'
import {
  DiscordIcon,
  EllipsisIcon,
  ExternalIcon,
  InstagramIcon,
  TwitterIcon,
  VerifiedIcon,
  XMarkIcon,
} from 'nft/components/icons'
import { useBag } from 'nft/hooks'
import { useIsCollectionLoading } from 'nft/hooks/useIsCollectionLoading'
import { GenieCollection, TokenType } from 'nft/types'
import { roundWholePercentage } from 'nft/utils/numbers'
import { ReactNode, useEffect, useReducer, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Anchor, Flex, FlexProps, Image, Shine, Text, styled as tamaguiStyled, useMedia, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const PercentChange = styled.div<{ isNegative: boolean }>`
  color: ${({ theme, isNegative }) => (isNegative ? theme.critical : theme.success)};
  display: flex;
  align-items: center;
  justify-content: center;
`

const CollectionNameTextLoading = styled.div`
  height: 32px;
  width: 236px;
`

const MobileSocialsOverflowIcon = styled.div`
  display: flex;
  margin-left: 4px;
  flex-direction: column;
  justify-content: center;
  height: 28px;
`

const CollectionImage = tamaguiStyled(Flex, {
  left: 0,
  borderStyle: 'solid',
  borderWidth: '4px',
  borderColor: '$surface1',
  borderRadius: '$roundedFull',
  position: 'absolute',
  width: 143,
  height: 143,
  verticalAlign: 'top',
  top: -118,
  boxShadow: 'var(--cardDropShadow)',
  $sm: {
    width: 60,
    height: 60,
    borderWidth: '2px',
    top: -20,
  },
})

const MobileSocialsIcon = ({ children, href }: { children: ReactNode; href: string }) => {
  return (
    <Anchor
      display="flex"
      target="_blank"
      rel="noreferrer"
      href={href}
      height="$spacing40"
      width="$spacing40"
      borderRadius="$roundedFull"
      backgroundColor="$surface1"
    >
      {children}
    </Anchor>
  )
}

const MobileSocialsPopover = ({
  collectionStats,
  collectionSocialsIsOpen,
  toggleCollectionSocials,
}: {
  collectionStats: GenieCollection
  collectionSocialsIsOpen: boolean
  toggleCollectionSocials: () => void
}) => {
  const colors = useSporeColors()
  return (
    <>
      <MobileSocialsOverflowIcon onClick={toggleCollectionSocials}>
        {collectionSocialsIsOpen ? (
          <XMarkIcon width="28" height="28" fill={colors.neutral2.val} />
        ) : (
          <EllipsisIcon width="28" height="20" fill={colors.neutral2.val} />
        )}
      </MobileSocialsOverflowIcon>
      {collectionSocialsIsOpen && (
        <Flex row position="absolute" gap="$gap4" alignItems="center" justifyContent="center" top={-48} right={-6}>
          {collectionStats.discordUrl ? (
            <MobileSocialsIcon href={collectionStats.discordUrl}>
              <Flex m="auto" pt="$spacing4">
                <DiscordIcon width={28} height={28} color={colors.neutral2.val} />
              </Flex>
            </MobileSocialsIcon>
          ) : null}
          {collectionStats.twitterUrl ? (
            <MobileSocialsIcon href={'https://twitter.com/' + collectionStats.twitterUrl}>
              <Flex m="auto" pt="$spacing6">
                <TwitterIcon fill={colors.neutral2.val} color={colors.neutral2.val} width="28px" height="28px" />
              </Flex>
            </MobileSocialsIcon>
          ) : null}

          {collectionStats.instagram ? (
            <MobileSocialsIcon href={'https://instagram.com/' + collectionStats.instagram}>
              <Flex m="auto" pl="$spacing2" pt="$spacing4">
                <InstagramIcon fill={colors.neutral2.val} width="28px" height="28px" />
              </Flex>
            </MobileSocialsIcon>
          ) : null}

          {collectionStats.externalUrl ? (
            <MobileSocialsIcon href={collectionStats.externalUrl}>
              <Flex m="auto" pt="$spacing4">
                <ExternalIcon fill={colors.neutral2.val} width="28px" height="28px" />
              </Flex>
            </MobileSocialsIcon>
          ) : null}
        </Flex>
      )}
    </>
  )
}

const SocialsIcon = ({ children, href }: { children: ReactNode; href: string }) => {
  return (
    <Anchor display="flex" target="_blank" rel="noreferrer" href={href} height="100%" justifyContent="center">
      {children}
    </Anchor>
  )
}

const CollectionName = ({
  collectionStats,
  name,
  isVerified,
  isMobile,
  collectionSocialsIsOpen,
  toggleCollectionSocials,
}: {
  collectionStats: GenieCollection
  name: string
  isVerified: boolean
  isMobile: boolean
  collectionSocialsIsOpen: boolean
  toggleCollectionSocials: () => void
}) => {
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)
  const colors = useSporeColors()
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex minWidth={0} row alignItems="center">
        {isCollectionStatsLoading ? (
          <Shine>
            <CollectionNameTextLoading />
          </Shine>
        ) : (
          <Text
            tag="h1"
            variant={isMobile ? 'heading2' : 'heading1'}
            $platform-web={{
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
            overflow="hidden"
            m={0}
            mr={isVerified ? 6 : 0}
          >
            {name}
          </Text>
        )}
        {isVerified && <VerifiedIcon style={{ width: '32px', height: '32px' }} />}
        <Flex
          row
          display="flex"
          $lg={{ display: 'none' }}
          alignItems="center"
          justifyContent="center"
          ml="$spacing32"
          gap="$gap8"
          height="$spacing32"
        >
          {collectionStats.discordUrl ? (
            <SocialsIcon href={collectionStats.discordUrl ?? ''}>
              <DiscordIcon fill={colors.neutral2.val} color={colors.neutral2.val} width="26px" height="26px" />
            </SocialsIcon>
          ) : null}
          {collectionStats.twitterUrl ? (
            <SocialsIcon href={'https://twitter.com/' + collectionStats.twitterUrl}>
              <TwitterIcon fill={colors.neutral2.val} color={colors.neutral2.val} width="26px" height="26px" />
            </SocialsIcon>
          ) : null}

          {collectionStats.instagram ? (
            <SocialsIcon href={'https://instagram.com/' + collectionStats.instagram}>
              <InstagramIcon fill={colors.neutral2.val} width="26px" height="26px" />
            </SocialsIcon>
          ) : null}
          {collectionStats.externalUrl ? (
            <SocialsIcon href={collectionStats.externalUrl ?? ''}>
              <ExternalIcon fill={colors.neutral2.val} width="26px" height="26px" />
            </SocialsIcon>
          ) : null}
        </Flex>
      </Flex>
      {isMobile &&
        (collectionStats.discordUrl ||
          collectionStats.twitterUrl ||
          collectionStats.instagram ||
          collectionStats.externalUrl) && (
          <MobileSocialsPopover
            collectionStats={collectionStats}
            collectionSocialsIsOpen={collectionSocialsIsOpen}
            toggleCollectionSocials={toggleCollectionSocials}
          />
        )}
    </Flex>
  )
}

const CollectionDescriptionLoading = () => (
  <Shine>
    <Flex
      mt="$spacing12"
      $lg={{ mt: '$spacing16' }}
      height="$spacing20"
      maxWidth="min(calc(100% - 112px), 600px)"
      borderRadius="$rounded12"
    />
  </Shine>
)

const CollectionDescription = ({ description }: { description: string }) => {
  const [showReadMore, setShowReadMore] = useState(false)
  const [readMore, toggleReadMore] = useReducer((state) => !state, false)
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)
  const isMobile = useIsMobile()
  const colors = useSporeColors()

  useEffect(() => {
    if (description.length > 75) {
      setShowReadMore(true)
    } else {
      setShowReadMore(false)
    }
  }, [description])

  return isCollectionStatsLoading ? (
    <CollectionDescriptionLoading />
  ) : (
    <Flex mt="$spacing12" $lg={{ mt: '$spacing16' }} maxWidth={680}>
      <style>
        {`
          .descriptionMarkdown {
            ${
              readMore
                ? css`
                    white-space: normal;
                    overflow: visible;
                    display: inline;
                    max-width: 100%;
                  `
                : css`
                    white-space: nowrap;
                    overflow: hidden;
                    display: inline-block;
                    max-width: min(calc(100% - 112px), 600px);
                  `
            }
          
            a[href] {
              color: ${colors.neutral2.val};
              text-decoration: none;
          
              :hover {
                opacity: 0.5;
              }
          
              :focus {
                opacity: 0.5;
              }
            }
          }
        `}
      </style>
      <Text
        tag="p"
        variant={isMobile ? 'body3' : 'body2'}
        className="descriptionMarkdown"
        m={0}
        $platform-web={{
          verticalAlign: 'top',
          textOverflow: 'ellipsis',
        }}
      >
        <ReactMarkdown
          source={showReadMore && !readMore ? description.slice(0, 75).concat('...') : description}
          allowedTypes={['link', 'paragraph', 'strong', 'code', 'emphasis', 'text']}
          renderers={{ paragraph: 'span' }}
        />
      </Text>
      {showReadMore && (
        <Text
          variant={isMobile ? 'body3' : 'body2'}
          onPress={toggleReadMore}
          ml={4}
          cursor="pointer"
          color="$neutral2"
          $platform-web={{
            verticalAlign: 'top',
          }}
        >
          show {readMore ? 'less' : 'more'}
        </Text>
      )}
    </Flex>
  )
}

const StatsItem = ({ children, label, shouldHide }: { children: ReactNode; label: string; shouldHide: boolean }) => {
  return (
    <Flex display={shouldHide ? 'none' : 'flex'} alignItems="baseline" gap="$gap4" height="fit-content">
      <Text variant="subheading2">{children}</Text>
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
    </Flex>
  )
}

const statsLoadingSkeleton = (isMobile: boolean) =>
  new Array(isMobile ? 3 : 5).fill(null).map((_, index) => (
    <Flex
      alignItems="baseline"
      gap="$gap4"
      height="fit-content"
      key={`statsLoadingSkeleton-key-${index}`}
      mb={isMobile ? '$spacing12' : '$spacing0'}
    >
      <Shine>
        <Flex width={60} height={16} borderRadius="$rounded12" />
      </Shine>
      <Shine>
        <Flex width={60} height={20} mt="$spacing8" borderRadius="$rounded12" />
      </Shine>
    </Flex>
  ))

const StatsRow = ({ stats, isMobile, ...props }: { stats: GenieCollection; isMobile?: boolean } & FlexProps) => {
  const { formatNumberOrString, formatDelta } = useFormatter()

  const uniqueOwnersPercentage = stats?.stats?.total_supply
    ? roundWholePercentage(((stats.stats.num_owners ?? 0) / stats.stats.total_supply) * 100)
    : 0
  const totalSupplyStr = stats.stats
    ? formatNumberOrString({ input: stats.stats.total_supply ?? 0, type: NumberType.NFTCollectionStats })
    : 0
  const listedPercentageStr = stats?.stats?.total_supply
    ? roundWholePercentage(((stats.stats.total_listings ?? 0) / stats.stats.total_supply) * 100)
    : 0
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  // round daily volume & floorPrice to 3 decimals or less
  const totalVolumeStr = formatNumberOrString({
    input: Number(stats.stats?.total_volume) ?? 0,
    type: NumberType.NFTCollectionStats,
  })
  const floorPriceStr = formatNumberOrString({
    input: stats.stats?.floor_price ?? 0,
    type: NumberType.NFTTokenFloorPrice,
  })
  // graphQL formatted %age values out of 100, whereas v3 endpoint did a decimal between 0 & 1
  const floorChangeStr = formatDelta(Math.round(Math.abs(stats?.stats?.one_day_floor_change ?? 0)))

  const isBagExpanded = useBag((state) => state.bagExpanded)
  const media = useMedia()
  const isSmallContainer = isMobile || (media.xl && isBagExpanded)

  return (
    <Flex row alignItems="center" gap={60} $md={{ gap: '$gap24' }} $lg={{ gap: '$gap36' }} $xl={{ gap: 48 }} {...props}>
      {isCollectionStatsLoading ? (
        statsLoadingSkeleton(isMobile ?? false)
      ) : (
        <>
          {stats.stats?.floor_price ? (
            <StatsItem label="Global floor" shouldHide={false}>
              {floorPriceStr} ETH
            </StatsItem>
          ) : null}
          {stats.stats?.one_day_floor_change !== undefined ? (
            <StatsItem label="Floor 24H" shouldHide={false}>
              <PercentChange isNegative={stats.stats.one_day_floor_change < 0}>
                <DeltaArrow delta={stats?.stats?.one_day_floor_change} />
                {floorChangeStr}
              </PercentChange>
            </StatsItem>
          ) : null}
          {stats.stats?.total_volume ? (
            <StatsItem label="Total volume" shouldHide={false}>
              {totalVolumeStr} ETH
            </StatsItem>
          ) : null}
          {totalSupplyStr ? (
            <StatsItem label="Items" shouldHide={isMobile ?? false}>
              {totalSupplyStr}
            </StatsItem>
          ) : null}
          {uniqueOwnersPercentage && stats.standard !== TokenType.ERC1155 ? (
            <StatsItem label="Unique owners" shouldHide={isSmallContainer ?? false}>
              {uniqueOwnersPercentage}%
            </StatsItem>
          ) : null}
          {stats.stats?.total_listings && stats.standard !== TokenType.ERC1155 ? (
            <StatsItem label="Listed" shouldHide={isSmallContainer ?? false}>
              {listedPercentageStr}%
            </StatsItem>
          ) : null}
        </>
      )}
    </Flex>
  )
}

export const CollectionStatsLoading = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <Flex width="100%">
      <CollectionImage borderWidth={4} borderColor="$surface1" />
      <Flex
        mt="$spacing40"
        mb="$spacing28"
        $lg={{
          mt: '$spacing8',
          mb: '$spacing0',
          ml: 68,
        }}
      >
        <Shine>
          <Flex height={32} width={236} borderRadius="$rounded12" />
        </Shine>
        {!isMobile && (
          <>
            <CollectionDescriptionLoading />
            <Flex row gap={60} mt="$spacing20">
              {statsLoadingSkeleton(false)}
            </Flex>
          </>
        )}
      </Flex>
      {isMobile && (
        <>
          <CollectionDescriptionLoading />
          <Flex row alignItems="center" gap="$gap20" mt="$spacing20">
            {statsLoadingSkeleton(true)}
          </Flex>
        </>
      )}
    </Flex>
  )
}

export const CollectionStats = ({ stats, isMobile }: { stats: GenieCollection; isMobile: boolean }) => {
  const [collectionSocialsIsOpen, toggleCollectionSocials] = useReducer((state) => !state, false)
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)
  const [imageError, setImageError] = useState(false)
  return (
    <Flex
      mt={isMobile && !stats.bannerImageUrl ? (collectionSocialsIsOpen ? 52 : 20) : 0}
      justifyContent="center"
      width="100%"
    >
      {isCollectionStatsLoading || !stats.imageUrl || imageError ? (
        <Shine disabled={!isCollectionStatsLoading}>
          <CollectionImage
            backgroundColor="$white"
            borderRadius="$roundedFull"
            position="absolute"
            borderWidth={4}
            borderColor="$surface3"
          />
        </Shine>
      ) : (
        <Image
          onError={() => setImageError(true)}
          $platform-web={{ verticalAlign: 'top' }}
          top={-118}
          src={stats.imageUrl}
          width={144}
          height={144}
          position="absolute"
          zIndex={zIndexes.mask}
          borderWidth={4}
          borderColor="$surface1"
          left={0}
          $lg={{
            width: 60,
            height: 60,
            top: -20,
            borderWidth: 2,
          }}
        />
      )}
      <Flex mt={40} mb={28} $md={{ mt: 8, mb: 0, ml: 68 }}>
        <CollectionName
          collectionStats={stats}
          name={stats.name ?? ''}
          isVerified={stats.isVerified ?? false}
          isMobile={isMobile}
          collectionSocialsIsOpen={collectionSocialsIsOpen}
          toggleCollectionSocials={toggleCollectionSocials}
        />
        {(stats.description || isCollectionStatsLoading) && !isMobile && (
          <CollectionDescription description={stats.description ?? ''} />
        )}
        <StatsRow display="flex" $lg={{ display: 'none' }} overflow="hidden" stats={stats} mt="$spacing20" />
      </Flex>
      {(stats.description || isCollectionStatsLoading) && isMobile && (
        <CollectionDescription description={stats.description ?? ''} />
      )}
      {/* eslint-disable-next-line react/forbid-elements */}
      <div id="nft-anchor-mobile" />
      <StatsRow isMobile display="none" $lg={{ display: 'flex' }} stats={stats} mt="$spacing20" mb="$spacing12" />
    </Flex>
  )
}
