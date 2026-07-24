import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { Globe } from 'ui/src/components/icons/Globe'
import { Lock } from 'ui/src/components/icons/Lock'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { shortenAddress } from 'utilities/src/addresses'
import { useAuctionLiquidityLock } from '~/features/Toucan/Auction/hooks/useAuctionLiquidityLock'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { ExternalLink } from '~/theme/components/Links'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const InfoRow = styled(Flex, {
  width: '100%',
  flexDirection: 'row',
  gap: '$spacing16',
})

const InfoCell = styled(Flex, {
  gap: '$spacing2',
  paddingVertical: '$spacing2',
  $md: {
    paddingVertical: '$spacing2',
  },
  variants: {
    withBorder: {
      true: {
        borderLeftWidth: 1,
        borderColor: '$surface3',
        paddingHorizontal: '$spacing16',
      },
    },
  } as const,
})

const SocialBadge = styled(Text, {
  variant: 'buttonLabel3',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing12',
  height: 32,
  borderRadius: '$rounded20',
  backgroundColor: '$surface3',
  ...ClickableTamaguiStyle,
  color: '$neutral1',
})

const CompanyIcon = styled(Flex, {
  width: 16,
  height: 16,
  borderRadius: '$roundedFull',
  backgroundColor: '$accent1',
  alignItems: 'center',
  justifyContent: 'center',
})

// Override ExternalLink's pink stroke to prevent it from affecting child SVG icons
const StyledExternalLink = deprecatedStyled(ExternalLink)`
  stroke: none;
`

const AddressWithCopy = ({ address }: { address: string }) => (
  <Flex row gap="$spacing4" alignItems="center" flexWrap="nowrap">
    <CopyHelper toCopy={address} iconPosition="right" iconSize={16} iconColor="$neutral2" alwaysShowIcon>
      <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
        {shortenAddress({ address, chars: 4 })}
      </Text>
    </CopyHelper>
  </Flex>
)

interface LockInfoCellItem {
  key: string
  label: ReactNode
  content: ReactNode
}

/**
 * Builds the liquidity-lock row of the info grid: % committed to LP, LP locked until,
 * LP owner, and (fees-forwarder mode only) fee recipient. Each cell is conditional on
 * its data existing, so the row is empty (and hidden) until the backend serves lock info.
 */
function useLockInfoCells(percentCommittedToLpFormatted: string | null): LockInfoCellItem[] {
  const { t } = useTranslation()
  const { isLocked, isPermanentlyLocked, unlockDateFormatted, lpOwner, feeRecipient } = useAuctionLiquidityLock()

  const cells: LockInfoCellItem[] = []

  if (percentCommittedToLpFormatted) {
    cells.push({
      key: 'percentCommittedToLp',
      label: (
        <Text variant="body3" color="$neutral2">
          {t('toucan.auction.stats.percentLP')}
        </Text>
      ),
      content: (
        <Text variant="subheading1" color="$neutral1">
          {percentCommittedToLpFormatted}
        </Text>
      ),
    })
  }

  // Permanent locks (burn / legacy max-int timelock) have no unlock date — render "Forever"
  if (isLocked && (isPermanentlyLocked || unlockDateFormatted)) {
    cells.push({
      key: 'lpLockedUntil',
      label: (
        <Flex row alignItems="center" gap="$spacing4">
          <Lock size="$icon.12" color="$statusSuccess" />
          <Text variant="body3" color="$neutral2">
            {t('toucan.auction.lpLockedUntil')}
          </Text>
        </Flex>
      ),
      content: (
        <Text variant="subheading1" color="$neutral1">
          {isPermanentlyLocked ? t('toucan.auction.lpLockedUntil.forever') : unlockDateFormatted}
        </Text>
      ),
    })
  }

  // Timelock operator when locked, pool owner otherwise (both served by GetAuction)
  if (lpOwner) {
    cells.push({
      key: 'lpOwner',
      label: (
        <Text variant="body3" color="$neutral2">
          {t('toucan.auction.lpOwner')}
        </Text>
      ),
      content: <AddressWithCopy address={lpOwner} />,
    })
  }

  if (feeRecipient) {
    cells.push({
      key: 'feeRecipient',
      label: (
        <Text variant="body3" color="$neutral2">
          {t('toucan.auction.feeRecipient')}
        </Text>
      ),
      content: <AddressWithCopy address={feeRecipient} />,
    })
  }

  return cells
}

export const AuctionInfo = () => {
  const { t } = useTranslation()
  const media = useMedia()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const descriptionRef = useRef<HTMLDivElement | null>(null)
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false)

  const { tokenAddress, launchedOnTimestamp, isAuctionInFuture, metadata, percentCommittedToLpFormatted } =
    useAuctionStatsData()
  const lockInfoCells = useLockInfoCells(percentCommittedToLpFormatted)

  // Only surface the "Show more" toggle when the clamped description actually
  // overflows its 2-line box. Measured while collapsed (expanded text is
  // unclamped and would always report as non-overflowing) and re-checked on
  // resize, since width changes affect wrapping.
  useEffect(() => {
    const element = descriptionRef.current
    if (!element) {
      return undefined
    }
    const measureTruncation = (): void => {
      if (isDescriptionExpanded) {
        return
      }
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight + 1)
    }
    measureTruncation()
    const resizeObserver = new ResizeObserver(measureTruncation)
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [metadata?.description, isDescriptionExpanded])

  const launchedOnLabel = isAuctionInFuture ? t('toucan.auction.launchesOn') : t('toucan.auction.launchedOn')
  const launchedOnValue = launchedOnTimestamp ? formatTimestampToDate(launchedOnTimestamp) : '--'

  return (
    <Flex maxWidth="100%" flexShrink={0} gap="$spacing16" $xl={{ width: 360 }} $lg={{ width: '100%' }}>
      <Flex gap="$spacing16">
        <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.info')}</Text>

        <InfoRow>
          {metadata?.launchedByName && (
            <InfoCell>
              <Text variant="body3" color="$neutral2">
                {t('toucan.auction.launchedBy')}
              </Text>
              <Flex row gap="$spacing8" alignItems="center" flexShrink={1} minWidth={0}>
                <CompanyIcon flexShrink={0}>
                  <Text variant="body3" fontSize={10} color="$surface1">
                    {metadata.launchedByName.charAt(0).toUpperCase()}
                  </Text>
                </CompanyIcon>
                <Text
                  variant="subheading1"
                  color="$neutral1"
                  numberOfLines={1}
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {metadata.launchedByName}
                </Text>
              </Flex>
            </InfoCell>
          )}

          <InfoCell withBorder={!!metadata?.launchedByName}>
            <Text variant="body3" color="$neutral2">
              {launchedOnLabel}
            </Text>
            <Text variant="subheading1" color="$neutral1">
              {launchedOnValue}
            </Text>
          </InfoCell>

          <InfoCell withBorder>
            <Text variant="body3" color="$neutral2">
              {t('toucan.auction.contractAddress')}
            </Text>
            {tokenAddress ? (
              <AddressWithCopy address={tokenAddress} />
            ) : (
              <Text variant="subheading1" color="$neutral1">
                --
              </Text>
            )}
          </InfoCell>
        </InfoRow>

        {lockInfoCells.length > 0 && (
          <InfoRow flexWrap="wrap">
            {lockInfoCells.map((cell, index) => (
              <InfoCell key={cell.key} withBorder={index > 0}>
                {cell.label}
                {cell.content}
              </InfoCell>
            ))}
          </InfoRow>
        )}

        {metadata?.description && (
          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              {t('toucan.auction.description')}
            </Text>
            <Text
              ref={descriptionRef}
              variant="body2"
              color="$neutral1"
              numberOfLines={isDescriptionExpanded ? undefined : 2}
              ellipsizeMode="tail"
            >
              {metadata.description}
            </Text>
            {isDescriptionTruncated && (
              <Text
                variant="buttonLabel3"
                color="$neutral2"
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                cursor="pointer"
                hoverStyle={{ color: '$neutral1' }}
              >
                {isDescriptionExpanded ? t('toucan.auction.showLess') : t('toucan.auction.showMore')}
              </Text>
            )}
          </Flex>
        )}

        {(metadata?.website || metadata?.twitter) && (
          <Flex row gap="$spacing8">
            {metadata.website && (
              <StyledExternalLink href={metadata.website}>
                <SocialBadge>
                  <Globe size={16} color="$neutral2" />
                  {t('toucan.auction.website')}
                </SocialBadge>
              </StyledExternalLink>
            )}
            {metadata.twitter && (
              <StyledExternalLink href={metadata.twitter}>
                <SocialBadge>
                  <XTwitter size={16} color="$neutral2" />
                  {t('toucan.auction.twitter')}
                </SocialBadge>
              </StyledExternalLink>
            )}
          </Flex>
        )}
      </Flex>

      <Text color="$neutral3" variant="body4">
        {t('toucan.auction.disclaimer.recommendations')}
      </Text>
    </Flex>
  )
}
