import { Button, Flex, iconSizes, type SpaceTokens, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TokenLogoPair } from 'uniswap/src/components/CurrencyLogo/TokenLogoPair'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { MouseoverTooltip } from '~/components/Tooltip'
import { logCollectFeesClick } from '~/features/Liquidity/analytics'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'

const MAX_VISIBLE_ROWS = 4

interface CollectableFeesListProps {
  positions: PositionInfo[]
  isFetching: boolean
  showCollectButton: boolean
  /** Runs before the row's collect dispatch opens the claim modal — hosts close themselves here. */
  onBeforeCollect?: () => void
  /** Vertical padding per row; the modal uses '$spacing8' per design. */
  rowPaddingVertical?: SpaceTokens
  /** Space between rows. The modal passes '$none' and spaces with row padding instead. */
  rowGap?: SpaceTokens
}

/**
 * Fee-position rows with per-row Collect and an expando past the first rows. Shared by the
 * portfolio fees panel and the Your fees modal; each host supplies positions from
 * `useCollectableFeePositions` and its own heading/total.
 */
export function CollectableFeesList({
  positions,
  isFetching,
  showCollectButton,
  onBeforeCollect,
  rowPaddingVertical,
  rowGap = '$gap8',
}: CollectableFeesListProps): JSX.Element | null {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  if (isFetching) {
    return (
      <Flex gap="$gap8">
        {Array.from({ length: MAX_VISIBLE_ROWS }).map((_, index) => (
          <FeeRowSkeleton key={index} />
        ))}
      </Flex>
    )
  }

  if (positions.length === 0) {
    return null
  }

  const hasOverflowRows = positions.length > MAX_VISIBLE_ROWS
  const visiblePositions = hasOverflowRows ? positions.slice(0, MAX_VISIBLE_ROWS) : positions
  const hiddenPositions = hasOverflowRows ? positions.slice(MAX_VISIBLE_ROWS) : []

  const renderRow = (position: PositionInfo): JSX.Element => (
    <FeeRow
      key={getPositionKey(position)}
      position={position}
      showCollectButton={showCollectButton}
      onBeforeCollect={onBeforeCollect}
      paddingVertical={rowPaddingVertical}
    />
  )

  return (
    <Flex gap={rowGap}>
      {visiblePositions.map(renderRow)}
      {hasOverflowRows && (
        <>
          <ExpandoRow
            isExpanded={isExpanded}
            onPress={() => setIsExpanded((prev) => !prev)}
            label={t('pool.fees.morePositions', { count: hiddenPositions.length })}
            color="$neutral2"
            labelVariant="buttonLabel4"
            py="$spacing4"
          />
          {isExpanded && hiddenPositions.map(renderRow)}
        </>
      )}
    </Flex>
  )
}

export function FeeRowSkeleton(): JSX.Element {
  return (
    <Flex row gap="$gap12" alignItems="center" width="100%">
      <Flex
        width={iconSizes.icon44}
        height={iconSizes.icon28}
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
      />
      <Flex flex={1}>
        <Text variant="body2" loading>
          -
        </Text>
      </Flex>
      <Flex width={iconSizes.icon64} height={iconSizes.icon28} borderRadius="$rounded12" backgroundColor="$surface3" />
    </Flex>
  )
}

function FeeRow({
  position,
  showCollectButton,
  onBeforeCollect,
  paddingVertical,
}: {
  position: PositionInfo
  showCollectButton: boolean
  onBeforeCollect?: () => void
  paddingVertical?: SpaceTokens
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const dispatch = useAppDispatch()
  const trace = useTrace()

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(position.currency0Amount.currency),
    currencyId(position.currency1Amount.currency),
  ])

  const handleCollect = useCallback(() => {
    logCollectFeesClick(position, trace)
    onBeforeCollect?.()
    dispatch(setOpenModal({ name: ModalName.ClaimFee, initialState: position }))
  }, [dispatch, onBeforeCollect, position, trace])

  const pairLabel = `${position.currency0Amount.currency.symbol ?? t('common.token')} / ${position.currency1Amount.currency.symbol ?? t('common.token')}`

  return (
    <Flex row gap="$gap12" alignItems="center" width="100%" py={paddingVertical}>
      <MouseoverTooltip text={pairLabel} placement="top" fitContent>
        <TokenLogoPair currency0Info={currency0Info} currency1Info={currency1Info} chainId={position.chainId} />
      </MouseoverTooltip>
      <Flex flex={1} testID={TestID.PortfolioPoolsFeesRow}>
        <AnimatedNumber
          value={convertFiatAmountFormatted(position.uncollectedFeesUsd ?? 0, NumberType.FiatTokenQuantity)}
          numericValue={position.uncollectedFeesUsd ?? 0}
          textVariant="$body2"
        />
      </Flex>
      {showCollectButton && (
        <Button size="xsmall" emphasis="secondary" fill={false} onPress={handleCollect}>
          {t('common.collect.button')}
        </Button>
      )}
    </Flex>
  )
}
