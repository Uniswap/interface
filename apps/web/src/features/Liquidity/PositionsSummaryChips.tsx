import type { HexString } from '@universe/encoding'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, Image, Skeleton, Text, useMedia } from 'ui/src'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { useGetPoolsRewards } from 'uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import tokenLogo from '~/assets/images/token-logo.png'
import { formatRewardsTotal } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { LP_INCENTIVES_CHAIN_IDS, LP_INCENTIVES_DUST_THRESHOLD } from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { useLpIncentiveRewardsUsdValue } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue'
import { LpIncentiveRewardLogos } from '~/features/Liquidity/LPIncentives/LpIncentiveRewardLogos'
import { LpIncentivesRewardsModal } from '~/features/Liquidity/LPIncentives/LpIncentivesRewardsModal'

interface PositionsSummaryChipsProps {
  onCollectRewards: () => void
  walletAddress?: HexString
  chainIds?: number[]
  setTokenRewards: (value: string) => void
  initialHasCollectedRewards: boolean
}

// Retiring multi_token_lp_incentives: every `isMultiTokenEnabled` branch below keeps its
// multi-token side and drops the other. What goes with the UNI-only side is the `useGetPoolsRewards`
// query and everything derived from it — `effectivelyClaimed`, `rawRewards`, `userHasRewards`,
// `formattedRewardsUsdValue`, the `setTokenRewards` effect — along with the `onCollectRewards` and
// `setTokenRewards` props, which only that path uses.
export function PositionsSummaryChips({
  onCollectRewards,
  walletAddress,
  chainIds = LP_INCENTIVES_CHAIN_IDS,
  setTokenRewards,
  initialHasCollectedRewards,
}: PositionsSummaryChipsProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isMultiTokenEnabled = useFeatureFlag(FeatureFlags.MultiTokenLpIncentives)
  // Only the active path fetches: the UNI query is disabled by flag, and the multi-token surface
  // keys its query on having an address.
  const multi = useLpIncentiveRewards(isMultiTokenEnabled ? walletAddress : undefined)
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false)
  const openRewardsModal = useEvent(() => setIsRewardsModalOpen(true))
  const closeRewardsModal = useEvent(() => setIsRewardsModalOpen(false))

  const { data: poolsBalance, loading: isLiquidityLoading } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress: walletAddress,
  })

  const {
    data: rewardsData,
    isLoading: isRewardsLoading,
    error: rewardsError,
  } = useGetPoolsRewards({ walletAddress, chainIds }, Boolean(walletAddress) && !isMultiTokenEnabled)

  const effectivelyClaimed = useEffectivelyClaimed({
    tokenRewards: rewardsData?.totalUnclaimedAmountUni,
    hasCollectedRewards: initialHasCollectedRewards,
  })

  const rawRewards = useMemo(
    () => (effectivelyClaimed ? '0' : (rewardsData?.totalUnclaimedAmountUni ?? '0')),
    [effectivelyClaimed, rewardsData?.totalUnclaimedAmountUni],
  )

  const userHasRewards = useMemo(() => {
    try {
      return BigInt(rawRewards) >= LP_INCENTIVES_DUST_THRESHOLD
    } catch {
      return false
    }
  }, [rawRewards])

  const { formattedUsdValue: formattedRewardsUsdValue } = useLpIncentiveRewardsUsdValue(rawRewards)

  useEffect(() => {
    // The multi-token path renders no UNI amount and its modal doesn't read this page state.
    if (isMultiTokenEnabled) {
      return
    }
    setTokenRewards(rawRewards)
  }, [rawRewards, setTokenRewards, isMultiTokenEnabled])

  return (
    <Flex row gap="$gap12" $sm={{ overflow: 'scroll', scrollbarWidth: 'none' }}>
      <SummaryChip label={t('pool.positions.summary.totalLiquidity')}>
        <ChipValue isLoading={isLiquidityLoading}>
          {convertFiatAmountFormatted(poolsBalance?.balanceUSD ?? 0, NumberType.PortfolioBalance)}
        </ChipValue>
      </SummaryChip>

      <SummaryChip
        label={t('pool.positions.summary.totalFees')}
        action={
          <Button emphasis="secondary" size="small" maxWidth="fit-content" disabled onPress={onCollectFeesNoop}>
            {t('common.collect.button')}
          </Button>
        }
      >
        {/* TODO(LP-954): wire up aggregate uncollected fees once GetWalletBalances exposes them */}
        <ChipValue>-</ChipValue>
      </SummaryChip>

      <SummaryChip
        label={t('pool.positions.summary.totalRewards')}
        action={
          // The UNI-only path's Collect handler emits this event on the page, so the Trace wraps
          // only the multi-token button — wrapping both would double-count the funnel.
          isMultiTokenEnabled ? (
            <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveCollectRewardsButtonClicked}>
              <Button
                emphasis="secondary"
                size="small"
                maxWidth="fit-content"
                disabled={!multi.hasRewards}
                onPress={openRewardsModal}
              >
                {t('common.collect.button')}
              </Button>
            </Trace>
          ) : (
            <Button
              emphasis="secondary"
              size="small"
              maxWidth="fit-content"
              disabled={!userHasRewards || Boolean(rewardsError)}
              onPress={onCollectRewards}
            >
              {t('common.collect.button')}
            </Button>
          )
        }
      >
        <Flex row gap="$spacing8" alignItems="center">
          {isMultiTokenEnabled ? (
            multi.rewardTokens.length > 0 && <LpIncentiveRewardLogos tokens={multi.rewardTokens} />
          ) : (
            <Image src={tokenLogo} width={24} height={24} objectFit="cover" />
          )}
          <ChipValue isLoading={isMultiTokenEnabled ? multi.isLoading : isRewardsLoading}>
            {isMultiTokenEnabled
              ? formatRewardsTotal(multi, convertFiatAmountFormatted)
              : rewardsError
                ? '-'
                : (formattedRewardsUsdValue ?? convertFiatAmountFormatted(0, NumberType.PortfolioBalance))}
          </ChipValue>
        </Flex>
      </SummaryChip>
      {isMultiTokenEnabled && (
        <LpIncentivesRewardsModal
          isOpen={isRewardsModalOpen}
          onClose={closeRewardsModal}
          walletAddress={walletAddress}
        />
      )}
    </Flex>
  )
}

function onCollectFeesNoop(): void {}

function SummaryChip({
  label,
  action,
  children,
}: {
  label: string
  action?: JSX.Element
  children: React.ReactNode
}): JSX.Element {
  return (
    <Flex
      grow
      flexBasis={0}
      gap="$spacing12"
      p="$spacing16"
      backgroundColor="$surface2"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      $sm={{ flexShrink: 0, minWidth: 210 }}
    >
      <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8" minHeight={32}>
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
        {action}
      </Flex>
      {children}
    </Flex>
  )
}

function ChipValue({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }): JSX.Element {
  const media = useMedia()

  if (isLoading) {
    return (
      <Skeleton>
        <FlexLoader borderRadius="$rounded4" height={media.sm ? 28 : 36} width={100} opacity={0.4} />
      </Skeleton>
    )
  }

  return (
    <Text variant={media.sm ? 'heading3' : 'heading2'} color="$neutral1">
      {children}
    </Text>
  )
}
