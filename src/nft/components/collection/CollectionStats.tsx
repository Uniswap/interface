import clsx from 'clsx'
import { Box, BoxProps } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { Marquee } from 'nft/components/layout/Marquee'
import { header2 } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { GenieCollection } from 'nft/types'
import { ethNumberStandardFormatter } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { ReactNode, useEffect, useReducer, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useIsLoading } from 'nft/hooks/useIsLoading'

import { DiscordIcon, EllipsisIcon, ExternalIcon, InstagramIcon, TwitterIcon, VerifiedIcon, XMarkIcon } from '../icons'
import * as styles from './CollectionStats.css'

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
  const isLoading = useIsLoading((state) => state.isLoading)

  return (
    <Column
      className={isLoading ? styles.iconsLoading : undefined}
      as="a"
      target="_blank"
      rel="noreferrer"
      href={href}
      height="full"
      justifyContent="center"
      color="backgroundSecondary"
    >
      {!isLoading && children}
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
  const isLoading = useIsLoading((state) => state.isLoading)
  const nameClass = isLoading ? styles.nameTextLoading : clsx(isMobile ? header2 : header2, styles.nameText)

  return (
    <Row justifyContent="space-between">
      <Row minWidth="0">
        <Box marginRight={!isVerified ? '12' : '0'} className={nameClass} style={{ lineHeight: '32px' }}>
          {name}
        </Box>
        {isVerified && !isLoading && <VerifiedIcon style={{ width: '32px', height: '32px' }} />}
        <Row
          display={{ sm: 'none', md: 'flex' }}
          alignItems="center"
          justifyContent="center"
          marginLeft="32"
          gap="8"
          height="32"
        >
          {collectionStats.discordUrl ? (
            <SocialsIcon href={collectionStats.discordUrl}>
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
            <SocialsIcon href={collectionStats.externalUrl}>
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
  const isLoading = useIsLoading((state) => state.isLoading)

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
  }, [descriptionRef, baseRef])

  // && !description
  return isLoading ? (
    <Box marginTop={{ sm: '12', md: '16' }} className={styles.descriptionLoading}>
      description
    </Box>
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
  const isLoading = useIsLoading((state) => state.isLoading)

  return (
    <Box display="flex" flexDirection={isMobile ? 'row' : 'column'} alignItems="baseline" gap="2" height="min">
      <Box as="span" className={isLoading ? styles.statsLabelLoading : styles.statsLabel}>
        {`${label}${isMobile ? ': ' : ''}`}
      </Box>
      <span className={isLoading ? styles.statsValueLoading : styles.statsValue}>{children}</span>
    </Box>
  )
}

const StatsRow = ({ stats, isMobile, ...props }: { stats: GenieCollection; isMobile?: boolean } & BoxProps) => {
  const numOwnersStr = stats.stats ? putCommas(stats.stats.num_owners) : 0
  const totalSupplyStr = stats.stats ? putCommas(stats.stats.total_supply) : 0
  const totalListingsStr = stats.stats ? putCommas(stats.stats.total_listings) : 0

  // round daily volume & floorPrice to 3 decimals or less
  const totalVolumeStr = ethNumberStandardFormatter(stats.stats?.total_volume)
  const floorPriceStr = ethNumberStandardFormatter(stats.floorPrice)

  return (
    <Row gap={{ sm: '20', md: '60' }} {...props}>
      <StatsItem label="Items" isMobile={isMobile ?? false}>
        {totalSupplyStr}
      </StatsItem>
      {numOwnersStr ? (
        <StatsItem label="Owners" isMobile={isMobile ?? false}>
          {numOwnersStr}
        </StatsItem>
      ) : null}
      {stats.floorPrice ? (
        <StatsItem label="Floor Price" isMobile={isMobile ?? false}>
          {floorPriceStr} ETH
        </StatsItem>
      ) : null}
      {stats.stats?.total_volume ? (
        <StatsItem label="Total Volume" isMobile={isMobile ?? false}>
          {totalVolumeStr} ETH
        </StatsItem>
      ) : null}
      {stats.stats?.total_listings ? (
        <StatsItem label="Listings" isMobile={isMobile ?? false}>
          {totalListingsStr}
        </StatsItem>
      ) : null}
    </Row>
  )
}

export const CollectionStats = ({ stats, isMobile }: { stats: GenieCollection; isMobile: boolean }) => {
  const [collectionSocialsIsOpen, toggleCollectionSocials] = useReducer((state) => !state, false)
  const isLoading = useIsLoading((state) => state.isLoading)

  return (
    <Box
      display="flex"
      marginTop={isMobile && !stats.bannerImageUrl ? (collectionSocialsIsOpen ? '52' : '20') : '0'}
      justifyContent="center"
      position="relative"
      flexDirection="column"
      width="full"
    >
      {isLoading && (
        <Box as="div" borderRadius="round" position="absolute" className={styles.collectionImageIsLoadingBackground} />
      )}
      <Box
        as={isLoading ? 'div' : 'img'}
        borderRadius="round"
        position="absolute"
        className={isLoading ? styles.collectionImageIsLoading : styles.collectionImage}
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
            {stats.description && <CollectionDescription description={stats.description} />}
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
