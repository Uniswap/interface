import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, iconSizes, useIsTouchDevice, useMedia } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { stopPropagationPressProps } from 'utilities/src/react/stopPropagation'
import { CollapsibleCellLayout } from '~/components/Table/PinnedColumns/collapse/CollapsibleCellLayout'
import { EXPANDED_LOGO_SIZE } from '~/components/Table/PinnedColumns/collapse/utils'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useEnrichedAuctions'
import { PoolsTradeBadge } from '~/features/Toucan/Shared/PoolsTradeBadge'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchClassification'
import { isPoolsSupportedChain } from '~/features/Toucan/utils/quickLaunchLinks'

export function TokenNameCell({ auction }: { auction: EnrichedAuction }) {
  const isTouchDevice = useIsTouchDevice()
  // Window <= lg, the same signal that narrows the token column, so the stacked name/symbol always gets the mobile width.
  const isCompact = useMedia().lg
  // QuickLaunch: pools.trade logo in the verified-icon slot; curated verified wins when both apply.
  // Off a pools.xyz-served chain the brand attribution would be false provenance.
  const isQuickLaunchBadgeEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const showQuickLaunchBadge =
    isQuickLaunchBadgeEnabled &&
    !auction.verified &&
    isQuickLaunchAuction(auction) &&
    isPoolsSupportedChain(auction.auction?.chainId)
  const name = auction.auction?.tokenName ?? auction.auction?.tokenSymbol ?? auction.auction?.tokenAddress ?? '—'
  const symbol = auction.auction?.tokenSymbol
  const nameText = (
    <MouseoverTooltip text={name} placement="top" size={TooltipSize.Small} style={{ minWidth: 0 }}>
      {/* The tooltip's wrapper forces cursor: default; restore the row's link cursor. */}
      <EllipsisText cursor="pointer">{name}</EllipsisText>
    </MouseoverTooltip>
  )
  const badges = (
    <>
      {auction.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
      {showQuickLaunchBadge && (
        // The logo-only badge's tooltip is the sole carrier of the pools.trade attribution, and on
        // touch devices a tap would otherwise land on the clickable row and navigate before the
        // tooltip opens — same fix as the sort-header info icon above. Desktop keeps click-through
        // since hover already shows the tooltip.
        <Flex alignItems="center" justifyContent="center" {...(isTouchDevice ? stopPropagationPressProps : {})}>
          <PoolsTradeBadge />
        </Flex>
      )}
    </>
  )
  // logoUrl already resolves API image -> config override -> indexed logo (see useTopAuctions)
  const logo = (
    <TokenLogo
      url={auction.logoUrl}
      size={isCompact ? EXPANDED_LOGO_SIZE : iconSizes.icon24}
      chainId={auction.auction?.chainId}
      symbol={symbol}
      name={auction.auction?.tokenName}
    />
  )
  if (isCompact) {
    // Compact is exactly when the table's pinned token column collapses to the logo on scroll.
    return (
      <CollapsibleCellLayout flush logo={logo}>
        <Flex row alignItems="center" gap="$spacing6" minWidth={0}>
          {nameText}
          {badges}
        </Flex>
        {symbol && symbol !== name && (
          <EllipsisText variant="body3" color="$neutral2">
            {symbol}
          </EllipsisText>
        )}
      </CollapsibleCellLayout>
    )
  }
  return (
    // shrink + the name's minWidth 0 let a long name ellipsize instead of overflowing the
    // overflow-hidden Cell, which would clip the symbol and badges off the end.
    <Flex row shrink gap="$gap8" alignItems="center" justifyContent="flex-start" width="100%">
      <Flex pr="$spacing4">{logo}</Flex>
      {nameText}
      <EllipsisText $platform-web={{ minWidth: 'fit-content' }} color="$neutral2">
        {symbol}
      </EllipsisText>
      {badges}
    </Flex>
  )
}
