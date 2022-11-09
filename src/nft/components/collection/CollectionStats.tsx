import clsx from 'clsx'
import { getDeltaArrow } from 'components/Tokens/TokenDetails/PriceChart'
import { NftGraphQlVariant, useNftGraphQlFlag } from 'featureFlags/flags/nftGraphQl'
import { Box, BoxProps } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { Marquee } from 'nft/components/layout/Marquee'
import { headlineMedium } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useIsCollectionLoading } from 'nft/hooks/useIsCollectionLoading'
import { GenieCollection, TokenType } from 'nft/types'
import { floorFormatter, quantityFormatter, roundWholePercentage, volumeFormatter } from 'nft/utils/numbers'
import { ReactNode, useEffect, useReducer, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components/macro'

import { DiscordIcon, EllipsisIcon, ExternalIcon, InstagramIcon, TwitterIcon, VerifiedIcon, XMarkIcon } from '../icons'
import * as styles from './CollectionStats.css'

const PercentChange = styled.div<{ isNegative: boolean }>`
  color: ${({ theme, isNegative }) => (isNegative ? theme.accentFailure : theme.accentSuccess)};
  display: flex;
  align-items: center;
  justify-content: center;
`

const MobileSocialsIcon = ({ children, href }: { children: ReactNode; href: string }) => {
  return (
    <Box
      display="flex"
      as="a"
      target="_blank"
      rel="noreferrer"
      href={href}
      height="40"
      width="40"
      borderRadius="round"
      backgroundColor="backgroundSurface"
    >
      {children}
    </Box>
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
  return (
    <>
      <Row marginLeft="4" onClick={() => toggleCollectionSocials()}>
        {collectionSocialsIsOpen ? (
          <XMarkIcon width="28" height="28" fill={themeVars.colors.textSecondary} />
        ) : (
          <EllipsisIcon width="28" height="28" fill={themeVars.colors.textSecondary} />
        )}
      </Row>
      {collectionSocialsIsOpen && (
        <Row
          position="absolute"
          gap="4"
          alignItems="center"
          justifyContent="center"
          style={{
            top: '-48px',
            right: '-6px',
          }}
        >
          {collectionStats.discordUrl ? (
            <MobileSocialsIcon href={collectionStats.discordUrl}>
              <Box margin="auto" paddingTop="4">
                <DiscordIcon width={28} height={28} color={themeVars.colors.textSecondary} />
              </Box>
            </MobileSocialsIcon>
          ) : null}
          {collectionStats.twitterUrl ? (
            <MobileSocialsIcon href={'https://twitter.com/' + collectionStats.twitterUrl}>
              <Box margin="auto" paddingTop="6">
                <TwitterIcon
                  fill={themeVars.colors.textSecondary}
                  color={themeVars.colors.textSecondary}
                  width="28px"
                  height="28px"
                />
              </Box>
            </MobileSocialsIcon>
          ) : null}

          {collectionStats.instagram ? (
            <MobileSocialsIcon href={'https://instagram.com/' + collectionStats.instagram}>
              <Box margin="auto" paddingLeft="2" paddingTop="4">
                <InstagramIcon fill={themeVars.colors.textSecondary} width="28px" height="28px" />
              </Box>
            </MobileSocialsIcon>
          ) : null}

          {collectionStats.externalUrl ? (
            <MobileSocialsIcon href={collectionStats.externalUrl}>
              <Box margin="auto" paddingTop="4">
                <ExternalIcon fill={themeVars.colors.textSecondary} width="28px" height="28px" />
              </Box>
            </MobileSocialsIcon>
          ) : null}
        </Row>
      )}
    </>
  )
}

const SocialsIcon = ({ children, href }: { children: ReactNode; href: string }) => {
  return (
    <Column as="a" target="_blank" rel="noreferrer" href={href} height="full" justifyContent="center">
      {children}
    </Column>
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
  const nameClass = isCollectionStatsLoading ? styles.nameTextLoading : clsx(headlineMedium, styles.nameText)

  return (
    <Row justifyContent="space-between">
      <Row minWidth="0">
        <Box marginRight={!isVerified ? '12' : '0'} className={nameClass}>
          {name}
        </Box>
        {isVerified && <VerifiedIcon style={{ width: '32px', height: '32px' }} />}
        <Row
          display={{ sm: 'none', md: 'flex' }}
          alignItems="center"
          justifyContent="center"
          marginLeft="32"
          gap="8"
          height="32"
        >
          {collectionStats.discordUrl ? (
            <SocialsIcon href={collectionStats.discordUrl ?? ''}>
              <DiscordIcon
                fill={themeVars.colors.textSecondary}
                color={themeVars.colors.textSecondary}
                width="26px"
                height="26px"
              />
            </SocialsIcon>
          ) : null}
          {collectionStats.twitterUrl ? (
            <SocialsIcon href={'https://twitter.com/' + collectionStats.twitterUrl}>
              <TwitterIcon
                fill={themeVars.colors.textSecondary}
                color={themeVars.colors.textSecondary}
                width="26px"
                height="26px"
              />
            </SocialsIcon>
          ) : null}

          {collectionStats.instagram ? (
            <SocialsIcon href={'https://instagram.com/' + collectionStats.instagram}>
              <InstagramIcon fill={themeVars.colors.textSecondary} width="26px" height="26px" />
            </SocialsIcon>
          ) : null}
          {collectionStats.externalUrl ? (
            <SocialsIcon href={collectionStats.externalUrl ?? ''}>
              <ExternalIcon fill={themeVars.colors.textSecondary} width="26px" height="26px" />
            </SocialsIcon>
          ) : null}
        </Row>
      </Row>
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
    </Row>
  )
}

const CollectionDescriptionLoading = () => (
  <Box marginTop={{ sm: '12', md: '16' }} className={styles.descriptionLoading} />
)

const CollectionDescription = ({ description }: { description: string }) => {
  const [showReadMore, setShowReadMore] = useState(false)
  const [readMore, toggleReadMore] = useReducer((state) => !state, false)
  const baseRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  useEffect(() => {
    if (
      baseRef &&
      descriptionRef &&
      baseRef.current &&
      descriptionRef.current &&
      (descriptionRef.current.getBoundingClientRect().width >= baseRef.current?.getBoundingClientRect().width - 112 ||
        descriptionRef.current.getBoundingClientRect().width >= 590)
    )
      setShowReadMore(true)
  }, [descriptionRef, baseRef, isCollectionStatsLoading])

  return isCollectionStatsLoading ? (
    <CollectionDescriptionLoading />
  ) : (
    <Box ref={baseRef} marginTop={{ sm: '12', md: '16' }} style={{ maxWidth: '680px' }}>
      <Box
        ref={descriptionRef}
        className={clsx(styles.description, styles.nameText, readMore && styles.descriptionOpen)}
      >
        <ReactMarkdown
          source={description}
          allowedTypes={['link', 'paragraph', 'strong', 'code', 'emphasis', 'text']}
          renderers={{ paragraph: 'span' }}
        />
      </Box>
      <Box as="span" display={showReadMore ? 'inline' : 'none'} className={styles.readMore} onClick={toggleReadMore}>
        show {readMore ? 'less' : 'more'}
      </Box>
    </Box>
  )
}

const StatsItem = ({ children, label, shouldHide }: { children: ReactNode; label: string; shouldHide: boolean }) => {
  return (
    <Box display={shouldHide ? 'none' : 'flex'} flexDirection={'column'} alignItems="baseline" gap="2" height="min">
      <span className={styles.statsValue}>{children}</span>
      <Box as="span" className={styles.statsLabel}>
        {label}
      </Box>
    </Box>
  )
}

const statsLoadingSkeleton = (isMobile: boolean) =>
  new Array(5).fill(
    <>
      <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} alignItems="baseline" gap="2" height="min">
        <div className={styles.statsLabelLoading} />
        <span className={styles.statsValueLoading} />
      </Box>
    </>
  )

const StatsRow = ({ stats, isMobile, ...props }: { stats: GenieCollection; isMobile?: boolean } & BoxProps) => {
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled
  const uniqueOwnersPercentage =
    stats.stats && stats.stats.total_supply
      ? roundWholePercentage(((stats.stats.num_owners ?? 0) / stats.stats.total_supply) * 100)
      : 0
  const totalSupplyStr = stats.stats ? quantityFormatter(stats.stats.total_supply ?? 0) : 0
  const listedPercentageStr =
    stats.stats && stats.stats.total_supply
      ? roundWholePercentage(((stats.stats.total_listings ?? 0) / stats.stats.total_supply) * 100)
      : 0
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  // round daily volume & floorPrice to 3 decimals or less
  const totalVolumeStr = volumeFormatter(stats.stats?.total_volume ?? 0)
  const floorPriceStr = floorFormatter(stats.stats?.floor_price ?? 0)
  // graphQL formatted %age values out of 100, whereas v3 endpoint did a decimal between 0 & 1
  // TODO: remove feature flag gated logic when graphql migration is complete
  const floorChangeStr =
    stats.stats && stats.stats.one_day_floor_change
      ? Math.round(Math.abs(stats.stats.one_day_floor_change) * (isNftGraphQl ? 1 : 100))
      : 0
  const arrow =
    stats.stats && stats.stats.one_day_floor_change !== undefined
      ? getDeltaArrow(stats.stats.one_day_floor_change)
      : null

  return (
    <Row gap={{ sm: '36', md: '60' }} {...props}>
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
                {arrow}
                {floorChangeStr}%
              </PercentChange>
            </StatsItem>
          ) : null}
          {stats.stats?.total_volume ? (
            <StatsItem label="Total Volume" shouldHide={false}>
              {totalVolumeStr} ETH
            </StatsItem>
          ) : null}
          {totalSupplyStr ? (
            <StatsItem label="Items" shouldHide={isMobile ?? false}>
              {totalSupplyStr}
            </StatsItem>
          ) : null}
          {uniqueOwnersPercentage ? (
            <StatsItem label="Unique owners" shouldHide={isMobile ?? false}>
              {uniqueOwnersPercentage}%
            </StatsItem>
          ) : null}

          {stats.stats?.total_listings && stats.standard !== TokenType.ERC1155 && listedPercentageStr > 0 ? (
            <StatsItem label="Listed" shouldHide={isMobile ?? false}>
              {listedPercentageStr}%
            </StatsItem>
          ) : null}
        </>
      )}
    </Row>
  )
}

export const CollectionStatsLoading = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <Column marginTop={isMobile ? '20' : '0'} position="relative" width="full">
      <Box className={styles.collectionImageIsLoadingBackground} />
      <Box className={styles.collectionImageIsLoading} />
      <Box className={styles.statsText}>
        <Box className={styles.nameTextLoading} />
        {!isMobile && (
          <>
            <CollectionDescriptionLoading />
            <Row gap={{ sm: '20', md: '60' }} marginTop="20">
              {statsLoadingSkeleton(isMobile)}
            </Row>
          </>
        )}
      </Box>
      {isMobile && (
        <>
          <Marquee>
            <Row gap={{ sm: '20', md: '60' }} marginX="6" marginY="28">
              {statsLoadingSkeleton(isMobile)}
            </Row>
          </Marquee>
        </>
      )}
    </Column>
  )
}

export const CollectionStats = ({ stats, isMobile }: { stats: GenieCollection; isMobile: boolean }) => {
  const [collectionSocialsIsOpen, toggleCollectionSocials] = useReducer((state) => !state, false)
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  return (
    <Box
      display="flex"
      marginTop={isMobile && !stats.bannerImageUrl ? (collectionSocialsIsOpen ? '52' : '20') : '0'}
      justifyContent="center"
      position="relative"
      flexDirection="column"
      width="full"
    >
      {isCollectionStatsLoading && (
        <Box as="div" borderRadius="round" position="absolute" className={styles.collectionImageIsLoadingBackground} />
      )}
      <Box
        as={isCollectionStatsLoading ? 'div' : 'img'}
        background="explicitWhite"
        borderRadius="round"
        position="absolute"
        className={isCollectionStatsLoading ? styles.collectionImageIsLoading : styles.collectionImage}
        src={stats.isFoundation && !stats.imageUrl ? '/nft/svgs/marketplaces/foundation.svg' : stats.imageUrl}
      />
      <Box className={styles.statsText}>
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
        <StatsRow display={{ sm: 'none', md: 'flex' }} stats={stats} marginTop="20" />
      </Box>
      {(stats.description || isCollectionStatsLoading) && isMobile && (
        <CollectionDescription description={stats.description ?? ''} />
      )}
      <StatsRow isMobile display={{ sm: 'flex', md: 'none' }} stats={stats} marginTop="20" marginBottom="12" />
    </Box>
  )
}
