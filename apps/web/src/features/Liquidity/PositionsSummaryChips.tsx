import { SharedEventName } from '@uniswap/analytics-events'
import type { UniverseChainId } from '@universe/chains'
import type { HexString } from '@universe/encoding'
import { Button, Flex, FlexLoader, Skeleton, Text, TouchableArea, type WebButtonPressEvent } from '@universe/mycelium'
import { type TestIDType, TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useWalletPositionsBalance } from 'uniswap/src/features/positions/hooks/useWalletPositionsBalance'
import { ElementName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { MouseoverTooltip } from '~/components/Tooltip'
import { YourFeesModal } from '~/features/Liquidity/fees/YourFeesModal'
import { formatRewardsTotal } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { LpIncentiveRewardLogos } from '~/features/Liquidity/LPIncentives/LpIncentiveRewardLogos'
import {
  LpIncentivesInfoTooltip,
  type LpIncentivesInfoVariant,
} from '~/features/Liquidity/LPIncentives/LpIncentivesInfoTooltip'
import { LpIncentivesRewardsModal } from '~/features/Liquidity/LPIncentives/LpIncentivesRewardsModal'
import { formatUsdTotal } from '~/features/Liquidity/utils/formatUsdTotal'
import { rightEdgeFadeStyle, useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'

/** Right page gutters (px) the mWeb carousel cancels so it bleeds to the viewport edge. */
interface SummaryChipsBleedGutters {
  md: number
  sm?: number
}

function carouselBleedStyle(gutterPx: number | undefined): { mr?: number; pr?: number } {
  return gutterPx === undefined ? {} : { mr: -gutterPx, pr: gutterPx }
}

interface PositionsSummaryChipsProps {
  walletAddress?: HexString
  balanceChainIds?: UniverseChainId[]
  showActions?: boolean
  rewardsTooltipVariant?: LpIncentivesInfoVariant
  bleedGutters?: SummaryChipsBleedGutters
}

export function PositionsSummaryChips({
  walletAddress,
  balanceChainIds,
  showActions = true,
  rewardsTooltipVariant = 'positions',
  bleedGutters,
}: PositionsSummaryChipsProps): JSX.Element {
  const { t } = useTranslation()
  const { scrollerRef, showRightFade } = useWheelHorizontalScroll()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const trace = useTrace()
  // Keys its query on having an address, so a disconnected wallet doesn't fetch.
  const rewards = useLpIncentiveRewards(walletAddress)
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false)
  const openRewardsModal = useEvent(() => setIsRewardsModalOpen(true))
  const closeRewardsModal = useEvent(() => setIsRewardsModalOpen(false))
  const [isFeesModalOpen, setIsFeesModalOpen] = useState(false)
  const openFeesModal = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.TotalFeesChip, ...trace })
    setIsFeesModalOpen(true)
  })
  const closeFeesModal = useEvent(() => setIsFeesModalOpen(false))

  const {
    totalLiquidityUsd,
    totalFeesUsd,
    isLoading: isLiquidityLoading,
    refetch: refetchPositionsBalance,
  } = useWalletPositionsBalance({
    account: walletAddress,
    chainIds: balanceChainIds,
  })

  usePendingLPTransactionsChangeListener(refetchPositionsBalance)

  const rewardsCollectable = rewards.hasRewards && !rewards.isError
  const liquidityValue = useMemo(
    () => formatUsdTotal(totalLiquidityUsd, convertFiatAmountFormatted),
    [totalLiquidityUsd, convertFiatAmountFormatted],
  )
  const feesValue = useMemo(
    () => formatUsdTotal(totalFeesUsd, convertFiatAmountFormatted),
    [totalFeesUsd, convertFiatAmountFormatted],
  )

  return (
    <Flex
      ref={scrollerRef}
      row
      gap="$gap12"
      alignSelf="stretch"
      className="scrollbar-hidden"
      $md={{ overflow: 'scroll', scrollbarWidth: 'none', ...carouselBleedStyle(bleedGutters?.md) }}
      $sm={carouselBleedStyle(bleedGutters?.sm)}
      $platform-web={rightEdgeFadeStyle(showRightFade)}
    >
      <SummaryChip label={t('pool.positions.summary.totalLiquidity')}>
        {/* A dash means unknown, a de-emphasized zero means the server said zero — never `?? 0`,
            which is what rendered a settled $0.00 under contradicting position rows. Gated on the
            value's absence rather than on an error flag, so a failed background refetch leaves the
            last good total on screen instead of blanking a number that is still correct. */}
        <ChipValue
          isLoading={isLiquidityLoading}
          isZero={!totalLiquidityUsd}
          fullValue={liquidityValue.full}
          testID={TestID.PositionsSummaryTotalLiquidity}
        >
          {liquidityValue.display}
        </ChipValue>
      </SummaryChip>

      <SummaryChip
        label={t('pool.positions.summary.totalFees')}
        collect={
          showActions
            ? {
                canCollect: (totalFeesUsd ?? 0) > 0,
                onCollect: openFeesModal,
                testID: TestID.PositionsSummaryCollectFees,
              }
            : undefined
        }
      >
        <ChipValue
          isLoading={isLiquidityLoading}
          isZero={!totalFeesUsd}
          fullValue={feesValue.full}
          testID={TestID.PositionsSummaryTotalFees}
        >
          {feesValue.display}
        </ChipValue>
      </SummaryChip>

      <SummaryChip
        label={t('pool.positions.summary.totalRewards')}
        tooltip={
          <RewardsChipTooltip
            isLoading={rewards.isLoading}
            hasError={rewards.isError}
            hasRewards={rewards.hasRewards}
            variant={rewardsTooltipVariant}
          />
        }
        collect={
          showActions
            ? {
                canCollect: rewardsCollectable,
                onCollect: openRewardsModal,
                logPress: true,
                testID: TestID.PositionsSummaryCollectRewards,
              }
            : undefined
        }
      >
        <Flex row gap="$spacing8" alignItems="center">
          {rewards.rewardTokens.length > 0 && <LpIncentiveRewardLogos tokens={rewards.rewardTokens} />}
          <ChipValue isLoading={rewards.isLoading} isZero={!rewards.hasRewards && !rewards.isError}>
            {formatRewardsTotal(rewards, convertFiatAmountFormatted)}
          </ChipValue>
        </Flex>
      </SummaryChip>
      {showActions && (
        <LpIncentivesRewardsModal
          isOpen={isRewardsModalOpen}
          onClose={closeRewardsModal}
          walletAddress={walletAddress}
        />
      )}
      {showActions && (
        <YourFeesModal
          isOpen={isFeesModalOpen}
          onClose={closeFeesModal}
          walletAddress={walletAddress}
          chainIds={balanceChainIds}
        />
      )}
    </Flex>
  )
}

interface SummaryChipCollect {
  canCollect: boolean
  onCollect: () => void
  // Every chip's button carries the same "Collect" label, so a role+name locator matches all of
  // them; the testID is what lets a test address one chip's action.
  testID: TestIDType
  logPress?: boolean
}

function CollectChipAction({ canCollect, onCollect, testID, logPress = false }: SummaryChipCollect): JSX.Element {
  const { t } = useTranslation()

  const button = (
    <Button
      emphasis="secondary"
      size="xsmall"
      maxWidth="fit-content"
      backgroundColor="$surface3"
      disabled={!canCollect}
      testID={testID}
      $md={{ display: 'none' }}
      onPress={(e: WebButtonPressEvent) => {
        e.stopPropagation()
        onCollect()
      }}
    >
      <Button.Text color={canCollect ? '$neutral1' : '$neutral3'}>{t('common.collect.button')}</Button.Text>
    </Button>
  )

  if (!logPress) {
    return button
  }

  return (
    <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveCollectRewardsButtonClicked}>
      {button}
    </Trace>
  )
}

function RewardsChipTooltip({
  isLoading,
  hasError,
  hasRewards,
  variant,
}: {
  isLoading: boolean
  hasError: boolean
  hasRewards: boolean
  variant: LpIncentivesInfoVariant
}): JSX.Element | null {
  // Nothing to explain while the total is still loading, or when there is no total to explain.
  if (isLoading || !(hasError || hasRewards)) {
    return null
  }

  // The chip itself is pressable, so the trigger has to swallow the press.
  return <LpIncentivesInfoTooltip hasError={hasError} variant={variant} stopPropagation />
}

const SUMMARY_CHIP_FRAME_PROPS = {
  flexGrow: 1,
  flexBasis: 0,
  gap: '$spacing12',
  p: '$spacing16',
  backgroundColor: '$surface2',
  borderRadius: '$rounded20',
  $md: { flexShrink: 0, minWidth: 160 },
} as const

function SummaryChip({
  label,
  tooltip,
  collect,
  children,
}: {
  label: string
  tooltip?: JSX.Element
  collect?: SummaryChipCollect
  children: React.ReactNode
}): JSX.Element {
  const content = (
    <>
      <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8" minHeight={32}>
        <Flex row gap="$gap4" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {label}
          </Text>
          {tooltip}
        </Flex>
        {collect && <CollectChipAction {...collect} />}
      </Flex>
      {children}
    </>
  )

  if (!collect?.canCollect) {
    return <Flex {...SUMMARY_CHIP_FRAME_PROPS}>{content}</Flex>
  }

  const touchable = (
    // Hover feedback is background-only; injection would also clone the Fragment child with a
    // `color` prop, which React flags on every hover/press.
    <TouchableArea
      {...SUMMARY_CHIP_FRAME_PROPS}
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      shouldAutomaticallyInjectColors={false}
      onPress={collect.onCollect}
    >
      {content}
    </TouchableArea>
  )

  if (!collect.logPress) {
    return touchable
  }

  return (
    <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveCollectRewardsButtonClicked}>
      {touchable}
    </Trace>
  )
}

function ChipValue({
  children,
  isLoading,
  isZero,
  fullValue,
  testID,
}: {
  children: React.ReactNode
  isLoading?: boolean
  isZero?: boolean
  fullValue?: string
  testID?: TestIDType
}): JSX.Element {
  if (isLoading) {
    return (
      <Skeleton>
        <FlexLoader borderRadius="$rounded4" height={36} $md={{ height: 28 }} width={100} opacity={0.4} />
      </Skeleton>
    )
  }

  const value = (
    <Text variant="heading2" $md={{ variant: 'heading3' }} color={isZero ? '$neutral3' : '$neutral1'} testID={testID}>
      {children}
    </Text>
  )

  if (!fullValue) {
    return value
  }

  return (
    <MouseoverTooltip text={fullValue} placement="top" fitContent>
      <Flex alignSelf="flex-start">{value}</Flex>
    </MouseoverTooltip>
  )
}
