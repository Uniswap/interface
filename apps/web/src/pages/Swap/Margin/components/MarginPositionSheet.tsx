import { Flex, getMenuItemColor, Text, TouchableArea, WebBottomSheet } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MarginDirection, type MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { formatLeverage, getMarginDirectionStyle } from '~/features/margin/utils/marginFormat'
import { hasMarginOpenedAt, marginCurrentLeverage } from '~/features/margin/utils/marginPositionRow'
import { marginPairLegs, marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import { type MarginActionItem, useMarginPositionActions } from '~/pages/Swap/Margin/hooks/useMarginPositionActions'
import { MarginChartPane } from '~/pages/Swap/Margin/MarginChartPane'
import { formatAge } from '~/pages/Swap/Margin/marginPositionsMath'

// Chart region inside the sheet: candles, volume when on, and the interval/style row.
const MARGIN_POSITION_SHEET_CHART_HEIGHT = 'min(420px, 50dvh)'
const HEADER_LOGO_SIZE = 32

type MarginModalRequest = { action: MarginManageAction; positionId: string }

/**
 * What MarginPositionsTable hands its card layout's sheet. The table renders the figures with its own
 * cells, so the sheet and the table cannot read a position differently; this file owns only the layout
 * and the chart, which the table must not import (it is in desktop's bundle too).
 */
export type MarginPositionSheetArgs = {
  isOpen: boolean
  onClose: () => void
  position: MarginActivePosition
  // Undefined when the registry cannot resolve the position's market: no chart and no actions then.
  market: MarginMarket | undefined
  figures: { pnl: ReactNode; markEntry: ReactNode; liqPrice: ReactNode; size: ReactNode; margin: ReactNode }
  onRequestModal: (request: MarginModalRequest) => void
}

/** One position, opened from its card: its market's chart with its lines, its figures, and its actions. */
export function MarginPositionSheet({
  isOpen,
  onClose,
  position,
  market,
  figures,
  onRequestModal,
}: MarginPositionSheetArgs): JSX.Element {
  const { t } = useTranslation()
  return (
    <Trace logImpression={isOpen} modal={ModalName.MarginPositionSheet}>
      <WebBottomSheet isOpen={isOpen} onClose={onClose} px="$spacing12" pb="$spacing16">
        {/* WebBottomSheet keeps its children mounted while closed; the chart runs only while open. */}
        {isOpen ? (
          <Flex width="100%" gap="$spacing16" testID={TestID.MarginPositionSheet}>
            <MarginPositionSheetHeader position={position} market={market} onClose={onClose} />
            {market ? (
              <Flex height={MARGIN_POSITION_SHEET_CHART_HEIGHT}>
                <MarginChartPane compact pinnedMarket={market} focusPositionId={position.positionId} />
              </Flex>
            ) : null}
            <Flex gap="$spacing16" px="$spacing4">
              <Flex row>
                <SheetFigure label={t('margin.table.pnl')} value={figures.pnl} />
                <SheetFigure label={t('margin.table.markEntry')} value={figures.markEntry} />
              </Flex>
              <Flex row>
                <SheetFigure label={t('margin.table.liqPrice')} value={figures.liqPrice} />
                <SheetFigure label={t('margin.positions.size')} value={figures.size} />
                <SheetFigure label={t('margin.table.margin')} value={figures.margin} />
              </Flex>
            </Flex>
            {/* Same rule as the table's row menu: with no market every action would mount a modal that
                immediately unmounts itself. */}
            {market ? (
              <MarginPositionSheetActions position={position} onClose={onClose} onRequestModal={onRequestModal} />
            ) : null}
          </Flex>
        ) : null}
      </WebBottomSheet>
    </Trace>
  )
}

function MarginPositionSheetHeader({
  position,
  market,
  onClose,
}: {
  position: MarginActivePosition
  market: MarginMarket | undefined
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const currencyInfos = useMarginCurrencyInfos()
  const logo = market ? getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos }) : undefined
  const directionStyle = getMarginDirectionStyle(position.direction)
  const directionLabel = position.direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')
  // Current leverage, read as the card reads it.
  const currentLeverage = marginCurrentLeverage(position)
  return (
    <Flex row alignItems="center" gap="$spacing8" px="$spacing4">
      {logo ? (
        <TokenLogo
          url={logo.inputLogoUrl}
          symbol={logo.inputFallbackSymbol}
          chainId={MARGIN_CHAIN_ID}
          size={HEADER_LOGO_SIZE}
        />
      ) : null}
      <Text variant="subheading1" color="$neutral1" numberOfLines={1} flexShrink={1}>
        {market ? marginUnwrapSymbol(marginPairLegs(market).base) : '—'}
      </Text>
      <Flex px="$spacing6" py="$spacing2" borderRadius="$rounded6" backgroundColor={directionStyle.backgroundColor}>
        <Text variant="buttonLabel4" color={directionStyle.color}>
          {currentLeverage === undefined ? directionLabel : `${directionLabel} ${formatLeverage(currentLeverage)}`}
        </Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing12" marginLeft="auto">
        <Text variant="body3" color="$neutral2">
          {hasMarginOpenedAt(position) ? formatAge({ openedAtSeconds: Number(position.openedAt) }) : '—'}
        </Text>
        <TouchableArea aria-label={t('common.close')} testID={TestID.MarginPositionSheetClose} onPress={onClose}>
          <X size="$icon.24" color="$neutral2" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

function SheetFigure({ label, value }: { label: string; value: ReactNode }): JSX.Element {
  return (
    <Flex flex={1} minWidth={0} gap="$spacing4" alignItems="flex-start">
      <Text variant="body4" color="$neutral2">
        {label}
      </Text>
      {value}
    </Flex>
  )
}

// "Modify" opens the position's actions in place: the same four the table's row menu offers, with the
// same gating. Picking one closes the sheet and hands the action to the table's action modals,
// so the modal never stacks on top of this sheet.
function MarginPositionSheetActions({
  position,
  onClose,
  onRequestModal,
}: {
  position: MarginActivePosition
  onClose: () => void
  onRequestModal: (request: MarginModalRequest) => void
}): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const toggle = useEvent(() => setIsOpen((open) => !open))
  const onSelect = useEvent((request: MarginModalRequest) => {
    onClose()
    onRequestModal(request)
  })
  const actions = useMarginPositionActions({ position, onSelect })
  return (
    <Flex gap="$spacing8">
      <TouchableArea
        row
        alignItems="center"
        justifyContent="center"
        height={48}
        px="$spacing16"
        borderRadius="$rounded16"
        backgroundColor="$surface3"
        aria-expanded={isOpen}
        testID={TestID.MarginPositionSheetModify}
        onPress={toggle}
      >
        <Text variant="buttonLabel2" color="$neutral1">
          {t('margin.mobile.modify')}
        </Text>
        <Flex position="absolute" right="$spacing16">
          <RotatableChevron direction={isOpen ? 'up' : 'down'} size="$icon.20" color="$neutral2" />
        </Flex>
      </TouchableArea>
      {isOpen ? (
        <Flex borderRadius="$rounded16" borderWidth={1} borderColor="$surface3" overflow="hidden">
          {actions.map((item) => (
            <MarginPositionSheetActionRow key={item.action} item={item} />
          ))}
        </Flex>
      ) : null}
    </Flex>
  )
}

function MarginPositionSheetActionRow({ item }: { item: MarginActionItem }): JSX.Element {
  // iconColor/textColor are forwarded as the override: getMenuItemColor tests the override before
  // `destructive`, which is what keeps a disabled Close grey rather than live red.
  const { Icon, label, subheader, destructive, disabled, iconColor, textColor, showDivider, onPress } = item
  // The menu color type also admits native color values Text can't take; margin items only pass tokens.
  const labelColor = getMenuItemColor({ overrideColor: textColor, destructive, disabled })
  return (
    <>
      {showDivider ? <Flex height={1} backgroundColor="$surface3" /> : null}
      <TouchableArea
        row
        alignItems="center"
        gap="$spacing12"
        px="$spacing16"
        py="$spacing12"
        disabled={disabled}
        hoverStyle={{ backgroundColor: '$surface2' }}
        // Nulled ourselves so a disabled row can't open its modal mid-plan.
        onPress={disabled ? undefined : onPress}
      >
        <Icon size="$icon.20" color={getMenuItemColor({ overrideColor: iconColor, destructive, disabled })} />
        <Flex flex={1} minWidth={0}>
          <Text variant="buttonLabel3" color={typeof labelColor === 'string' ? labelColor : undefined}>
            {label}
          </Text>
          <Text variant="body4" color="$neutral2">
            {subheader}
          </Text>
        </Flex>
      </TouchableArea>
    </>
  )
}
