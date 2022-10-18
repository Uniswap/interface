import clsx from 'clsx'
import { getDeltaArrow } from 'components/Tokens/TokenDetails/PriceChart'
import { Box, BoxProps } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { Marquee } from 'nft/components/layout/Marquee'
import { headlineMedium } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useIsCollectionLoading } from 'nft/hooks/useIsCollectionLoading'
import { GenieCollection } from 'nft/types'
import { floorFormatter, quantityFormatter, roundWholePercentage, volumeFormatter } from 'nft/utils/numbers'
import { ReactNode, useEffect, useReducer, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components/macro'

import { DiscordIcon, EllipsisIcon, ExternalIcon, InstagramIcon, TwitterIcon, VerifiedIcon, XMarkIcon } from '../icons'
import * as styles from './CollectionStats.css'

const PercentChange = styled.div`
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
          {collectionStats.twitter ? (
            <MobileSocialsIcon href={'https://twitter.com/' + collectionStats.twitter}>
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
          {collectionStats.twitter ? (
            <SocialsIcon href={'https://twitter.com/' + collectionStats.twitter}>
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
          collectionStats.twitter ||
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
    <Box marginTop={{ sm: '12', md: '16' }} className={styles.descriptionLoading}></Box>
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
        Show {readMore ? 'less' : 'more'}
      </Box>
    </Box>
  )
}

const StatsItem = ({ children, label, isMobile }: { children: ReactNode; label: string; isMobile: boolean }) => {
  return (
    <Box display="flex" flexDirection={'column'} alignItems="baseline" gap="2" height="min">
      <span className={styles.statsValue}>{children}</span>
      <Box as="span" className={styles.statsLabel}>
        {label}
      </Box>
    </Box>
  )
}

const StatsRow = ({ stats, isMobile, ...props }: { stats: GenieCollection; isMobile?: boolean } & BoxProps) => {
  const uniqueOwnersPercentage = stats.stats
    ? roundWholePercentage((stats.stats.num_owners / stats.stats.total_supply) * 100)
    : 0
  const totalSupplyStr = stats.stats ? quantityFormatter(stats.stats.total_supply) : 0
  const listedPercentageStr =
    stats.stats && stats.stats.total_listings > 0
      ? roundWholePercentage((stats.stats.total_listings / stats.stats.total_supply) * 100)
      : 0
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  // round daily volume & floorPrice to 3 decimals or less
  const totalVolumeStr = volumeFormatter(stats.stats?.total_volume)
  const floorPriceStr = floorFormatter(stats.floorPrice)
  const floorChangeStr =
    stats.stats && stats.stats.one_day_floor_change ? Math.round(Math.abs(stats.stats.one_day_floor_change) * 100) : 0
  const arrow = stats.stats && stats.stats.one_day_change ? getDeltaArrow(stats.stats.one_day_floor_change) : null

  const statsLoadingSkeleton = new Array(5).fill(
    <>
      <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} alignItems="baseline" gap="2" height="min">
        <div className={styles.statsLabelLoading} />
        <span className={styles.statsValueLoading} />
      </Box>
    </>
  )

  return (
    <Row gap={{ sm: '20', md: '60' }} {...props}>
      {isCollectionStatsLoading && statsLoadingSkeleton}
      {stats.floorPrice ? (
        <StatsItem label="Global floor" isMobile={isMobile ?? false}>
          {floorPriceStr} ETH
        </StatsItem>
      ) : null}
      {stats.stats?.one_day_floor_change ? (
        <StatsItem label="24-Hour Floor" isMobile={isMobile ?? false}>
          <PercentChange>
            {floorChangeStr}% {arrow}
          </PercentChange>
        </StatsItem>
      ) : null}
      {stats.stats?.total_volume ? (
        <StatsItem label="Total volume" isMobile={isMobile ?? false}>
          {totalVolumeStr} ETH
        </StatsItem>
      ) : null}
      {totalSupplyStr ? (
        <StatsItem label="Items" isMobile={isMobile ?? false}>
          {totalSupplyStr}
        </StatsItem>
      ) : null}
      {uniqueOwnersPercentage ? (
        <StatsItem label="Unique owners" isMobile={isMobile ?? false}>
          {uniqueOwnersPercentage}%
        </StatsItem>
      ) : null}
      {stats.stats?.total_volume ? (
        <StatsItem label="Total Volume" isMobile={isMobile ?? false}>
          {totalVolumeStr} ETH
        </StatsItem>
      ) : null}
      {stats.stats?.total_listings && listedPercentageStr > 0 ? (
        <StatsItem label="Listed" isMobile={isMobile ?? false}>
          {listedPercentageStr}%
        </StatsItem>
      ) : null}
    </Row>
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
          name={stats.name}
          isVerified={stats.isVerified}
          isMobile={isMobile}
          collectionSocialsIsOpen={collectionSocialsIsOpen}
          toggleCollectionSocials={toggleCollectionSocials}
        />
        {!isMobile && (
          <>
            {(stats.description || isCollectionStatsLoading) && (
              <CollectionDescription description={stats.description} />
            )}
            <StatsRow stats={stats} marginTop="20" />
          </>
        )}
      </Box>
      {isMobile && (
        <>
          <Box marginBottom="12">{stats.description && <CollectionDescription description={stats.description} />}</Box>
          <Marquee>
            <StatsRow stats={stats} marginLeft="6" marginRight="6" marginBottom="28" isMobile />
          </Marquee>
        </>
      )}
    </Box>
  )
}
