import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useIsTouchDevice } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getMenuItemColor, IconButton, Separator, Tooltip } from 'ui/src'
import type {
  MarginActivePosition,
  MarginDecreaseActivity,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { type MarginMarket } from '~/constants/margin'
import { MarginPositionActionsMenu } from '~/pages/Swap/Margin/components/MarginPositionActionsMenu'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { MarginDetailRow } from '~/pages/Swap/Margin/components/shared/MarginDetailRow'
import { useMarginPnlCopy } from '~/pages/Swap/Margin/components/shared/MarginExplainer'
import { MarginLiquidationPill } from '~/pages/Swap/Margin/components/shared/MarginLiquidationPill'
import { type MarginActionItem, useMarginPositionActions } from '~/pages/Swap/Margin/hooks/useMarginPositionActions'
import { useResolveMarginMarketForPosition } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import {
  CAUTION_MIN_HF,
  formatBorrowRate,
  formatLeverageX,
  getMarginLiquidationBadge,
  lltvToPercent,
  marginVenueLabel,
  rawToNumber,
  scaledE18ToNumber,
} from '~/pages/Swap/Margin/marginFormat'
import { buildMarginDrawerPnlRows } from '~/pages/Swap/Margin/marginPnlExplainer'
import {
  hasMarginOpenedAt,
  hasMarginPositionBasis,
  marginEquityContributedAtOpen,
  marginOpenedLeverage,
  marginPositionAccount,
  marginPositionDebt,
} from '~/pages/Swap/Margin/marginPositionRow'
import { marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'
import { marginUsdBasis, marginUsdPnlNow } from '~/pages/Swap/Margin/marginUsdPnl'

function DecreaseActivityLines({
  position,
  market,
}: {
  position: MarginActivePosition
  market: MarginMarket
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  if (!position.decreases || position.decreases.length === 0) {
    return null
  }
  return (
    <Flex gap="$spacing4">
      {position.decreases.map((activity: MarginDecreaseActivity) => (
        <Text key={activity.txHash} variant="body4" color="$neutral2">
          {t('margin.drawer.reducedActivity', {
            debt: `${formatNumberOrString({
              value: rawToNumber({ raw: activity.debtRepaid, decimals: market.debt.decimals }),
              type: NumberType.TokenNonTx,
            })} ${marginUnwrapSymbol(market.debt)}`,
            collateral: `${formatNumberOrString({
              value: rawToNumber({ raw: activity.collateralSold, decimals: market.collateral.decimals }),
              type: NumberType.TokenNonTx,
            })} ${market.displaySymbol}`,
            price: activity.exitPrice
              ? formatNumberOrString({
                  value: scaledE18ToNumber(activity.exitPrice),
                  type: NumberType.FiatTokenPrice,
                })
              : '—',
          })}
        </Text>
      ))}
    </Flex>
  )
}

// A labeled data cell for the expanded-row detail grid: $neutral2 label above the value. A string value
// gets the default style; a node (the venue chip / health value) renders as-is.
function DrawerDataCell({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <Flex gap="$spacing2" minWidth={112}>
      <Text variant="body4" color="$neutral2">
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text variant="body3" color="$neutral1">
          {value}
        </Text>
      ) : (
        value
      )}
    </Flex>
  )
}

// One 36x36 action button: size="small" ($spacing8 padding) + $icon.20, which also gives $rounded12 —
// IconButtonProps strips width/height at the type level, so the size is arithmetic.
function MarginActionIconButton({ item }: { item: MarginActionItem }): JSX.Element {
  // iconColor MUST be forwarded as overrideColor — getMenuItemColor tests overrideColor -> destructive
  // -> disabled, so dropping it re-renders a disabled Close in full $statusCritical.
  const { Icon, label, tooltipBody, destructive, disabled, iconColor, onPress } = item
  return (
    // Raw Tooltip, not InfoTooltip: the latter wraps its trigger in a Flex row that would inject
    // layout between buttons, and hardcodes its own timing.
    <Tooltip placement="top" delay={{ open: 200, close: 0 }} allowFlip stayInFrame>
      <Tooltip.Trigger>
        <IconButton
          size="small"
          emphasis="secondary"
          aria-label={label}
          disabled={disabled}
          // Null out onPress ourselves so a disabled (greyed-out) icon can't open its modal mid-plan.
          onPress={disabled ? undefined : onPress}
          icon={<Icon size="$icon.20" color={getMenuItemColor({ overrideColor: iconColor, destructive, disabled })} />}
        />
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Flex gap="$spacing2" maxWidth={260}>
          <Text variant="body4">{label}</Text>
          {/* tooltipBody, not subheader — the menu's short fragment vs the full sentence. */}
          <Text variant="body4" color="$neutral2">
            {tooltipBody}
          </Text>
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}

// Hover tooltips do not exist on touch, so five unlabeled 36x36 squares — two of them Plus/Minus, one
// destructive — is the alternative. Fall back to the same labeled menu the row exposes.
function MarginDrawerActions({
  position,
  onRequestModal,
}: {
  position: MarginActivePosition
  onRequestModal: (request: { action: MarginManageAction; positionId: string }) => void
}): JSX.Element {
  const isTouchDevice = useIsTouchDevice()
  const actionItems = useMarginPositionActions({ position, onSelect: onRequestModal, surface: 'drawer' })

  if (isTouchDevice) {
    return (
      <Flex row justifyContent="flex-end" flexShrink={0}>
        <MarginPositionActionsMenu position={position} mountKey="drawer" onSelect={onRequestModal} />
      </Flex>
    )
  }
  // 5x36 + 4x8 = 212px held beside a flex={1} column that stacks at media.xl, and Flex defaults to
  // flexShrink: 0 — so wrap rather than overflow when the row genuinely runs out of width.
  return (
    <Flex row flexWrap="wrap" justifyContent="flex-end" alignItems="center" gap="$spacing8" flexShrink={0}>
      {actionItems.map((item) => (
        <MarginActionIconButton key={item.action} item={item} />
      ))}
    </Flex>
  )
}

// Outlined, not a card: cards are controls, outlined blocks are funds. Persistent rather than hovered,
// because this is the only PnL disclosure a touch device can reach.
function MarginDrawerPnlBlock({
  position,
  market,
}: {
  position: MarginActivePosition
  market: MarginMarket
}): JSX.Element | null {
  const { formatNumberOrString } = useLocalizationContext()
  const copy = useMarginPnlCopy()
  const basis = marginUsdBasis({ position, market })
  const pnl = marginUsdPnlNow({ position, market })
  if (!basis || !pnl) {
    return null
  }
  const rows = buildMarginDrawerPnlRows({
    basis,
    pnl,
    formatFiat: (value) => formatNumberOrString({ value, type: NumberType.FiatStandard }),
    formatPrice: (value) => formatNumberOrString({ value, type: NumberType.FiatTokenPrice }),
  })
  return (
    <Flex
      gap="$spacing6"
      p="$spacing12"
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded12"
      maxWidth={320}
    >
      <Text variant="body4" color="$neutral2">
        {copy.title}
      </Text>
      {rows.map((row) => (
        <MarginDetailRow
          key={row.id}
          label={copy.row[row.id]}
          // MarginDetailRow renders a plain string in $neutral1, which would make a -$25.00 loss look
          // identical to a +$25.00 gain. It takes a ReactNode, so pass the tone through.
          value={
            row.tone ? (
              <Text variant="body3" color={row.tone === 'positive' ? '$statusSuccess' : '$statusCritical'}>
                {row.value}
              </Text>
            ) : (
              row.value
            )
          }
          tooltip={row.id === 'breakEven' ? copy.breakEvenRow : undefined}
        />
      ))}
    </Flex>
  )
}

// The expanded content under a position row: a left column pairing the lending-detail grid with the
// small entry/opened/sub-account/decrease-activity meta, and the management-action cluster alongside.
export function MarginPositionDrawer({
  position,
  onRequestModal,
}: {
  position: MarginActivePosition
  onRequestModal: (request: { action: MarginManageAction; positionId: string }) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const [isCopied, copy] = useCopyClipboard()
  const media = useMedia()
  // Live registry first, else a currency-info fallback, so a server/indexer-sourced position in a
  // market outside the registry still renders a manageable drawer (parity with the table).
  const market = useResolveMarginMarketForPosition(position)

  const account = marginPositionAccount(position)
  const onCopyAccount = useEvent(() => {
    if (account) {
      void copy(account)
    }
  })

  if (!market) {
    return (
      <Flex px="$spacing16" pb="$spacing16" backgroundColor="$surface1">
        <Separator />
        <Text variant="body3" color="$neutral2" pt="$spacing12">
          {t('margin.market.empty')}
        </Text>
      </Flex>
    )
  }

  const debtDecimals = market.debt.decimals
  const debtRaw = marginPositionDebt(position)
  const hasDebt = BigInt(debtRaw) !== 0n
  const healthFactor = scaledE18ToNumber(position.healthFactor)
  const nearLiquidation = hasDebt && healthFactor < CAUTION_MIN_HF
  // A still-open position that was liquidated is only partially liquidated (residual collateral remains).
  const liquidationBadge = getMarginLiquidationBadge({ liquidated: position.liquidated, status: 'open' })
  const debt = rawToNumber({ raw: debtRaw, decimals: debtDecimals })
  const borrowingValue = `${formatNumberOrString({ value: debt, type: NumberType.TokenNonTx })} ${marginUnwrapSymbol(market.debt)}`
  const accrued =
    position.accruedInterest !== undefined
      ? rawToNumber({ raw: position.accruedInterest, decimals: debtDecimals })
      : undefined
  const interestValue =
    accrued !== undefined
      ? `${formatNumberOrString({ value: accrued, type: NumberType.TokenNonTx })} ${marginUnwrapSymbol(market.debt)}`
      : '—'
  const lltvPercent = lltvToPercent(market.lltvWad)
  // '0' is the wire's absent sentinel (no at-open mark stamped), not a $0 entry — same gate as the table.
  const hasBasis = hasMarginPositionBasis(position)
  const entryPrice = hasBasis ? scaledE18ToNumber(position.entryPrice) : 0
  const equityContributed = marginEquityContributedAtOpen({ position })
  // Omitted, not zeroed, where the indexer never recorded a ratio — see marginOpenedLeverage.
  const openedLeverage = marginOpenedLeverage(position)
  const contributedValue =
    equityContributed === undefined
      ? undefined
      : `${formatNumberOrString({ value: equityContributed, type: NumberType.TokenNonTx })} ${market.displaySymbol}`

  // Venue chip: brand ghost (Morpho / Aave) + venue label, optionally with LLTV.
  const marketValue = (
    <Flex row alignItems="center" gap="$spacing6">
      <MarginVenueLogo venue={market.venue} size="$icon.16" />
      <Text variant="body3" color="$neutral1">
        {lltvPercent > 0
          ? t('margin.market.venueLltv', { venue: marginVenueLabel(market.venue), lltv: Math.round(lltvPercent) })
          : marginVenueLabel(market.venue)}
      </Text>
    </Flex>
  )

  return (
    <Flex gap="$spacing12" px="$spacing16" pb="$spacing16" backgroundColor="$surface1">
      <Separator />
      {liquidationBadge ? (
        <Flex row>
          <MarginLiquidationPill badge={liquidationBadge} px="$spacing8" />
        </Flex>
      ) : null}
      {nearLiquidation ? (
        <Flex p="$spacing8" borderRadius="$rounded12" backgroundColor="$statusCritical2">
          <Text variant="body4" color="$statusCritical">
            {t('margin.warning.nearLiquidation')}
          </Text>
        </Flex>
      ) : null}

      <Flex row={!media.xl} gap="$spacing16" justifyContent="space-between" alignItems="flex-start">
        <Flex flex={1} gap="$spacing12">
          <Flex row flexWrap="wrap" gap="$spacing16" rowGap="$spacing12">
            <DrawerDataCell label={t('margin.drawer.market')} value={marketValue} />
            <DrawerDataCell label={t('margin.size.borrowing')} value={borrowingValue} />
            <DrawerDataCell
              label={t('margin.fees.borrowRate')}
              value={formatBorrowRate(
                position.borrowRate !== undefined ? scaledE18ToNumber(position.borrowRate) * 10_000 : undefined,
              )}
            />
            <DrawerDataCell label={t('margin.drawer.interestAccrued')} value={interestValue} />
            {openedLeverage !== undefined ? (
              <DrawerDataCell label={t('margin.drawer.openedLeverage')} value={formatLeverageX(openedLeverage)} />
            ) : null}
          </Flex>
          <MarginDrawerPnlBlock position={position} market={market} />
          <Flex gap="$spacing4">
            <Flex row flexWrap="wrap" gap="$spacing8" alignItems="center">
              {entryPrice > 0 ? (
                <Text variant="body4" color="$neutral2">
                  {t('margin.drawer.entry')}{' '}
                  {formatNumberOrString({ value: entryPrice, type: NumberType.FiatTokenPrice })}
                </Text>
              ) : null}
              {/* Its own labelled chip rather than a suffix on the entry price: it derives from
                  collateralAtOpen and the opened leverage, neither of which needs an at-open mark, so a
                  position carrying the '0' entry-price sentinel would otherwise lose it too. */}
              {contributedValue === undefined ? null : (
                <Text variant="body4" color="$neutral2">
                  {t('margin.drawer.marginAtOpen')} {contributedValue}
                </Text>
              )}
              {hasMarginOpenedAt(position) ? (
                <Text variant="body4" color="$neutral2">
                  {t('margin.drawer.openedAt')} {new Date(Number(position.openedAt) * 1000).toLocaleDateString(locale)}
                </Text>
              ) : null}
              <TouchableArea onPress={onCopyAccount} aria-label={t('common.copy.address')}>
                <Text variant="body4" color="$neutral2">
                  {t('margin.drawer.account')}{' '}
                  {isCopied ? t('common.copied') : account ? shortenAddress({ address: account }) : '—'}
                </Text>
              </TouchableArea>
            </Flex>
            <DecreaseActivityLines position={position} market={market} />
          </Flex>
        </Flex>
        <MarginDrawerActions position={position} onRequestModal={onRequestModal} />
      </Flex>
    </Flex>
  )
}
