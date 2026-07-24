import type { HexString } from '@universe/encoding'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, Image, Skeleton, Text, useMedia } from 'ui/src'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import tokenLogo from '~/assets/images/token-logo.png'
import { LP_INCENTIVES_CHAIN_IDS, LP_INCENTIVES_DUST_THRESHOLD } from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'
import { useLpIncentiveRewardsUsdValue } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue'

interface PositionsSummaryChipsProps {
  onCollectRewards: () => void
  walletAddress?: HexString
  chainIds?: number[]
  setTokenRewards: (value: string) => void
  initialHasCollectedRewards: boolean
}

export function PositionsSummaryChips({
  onCollectRewards,
  walletAddress,
  chainIds = LP_INCENTIVES_CHAIN_IDS,
  setTokenRewards,
  initialHasCollectedRewards,
}: PositionsSummaryChipsProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { data: poolsBalance, loading: isLiquidityLoading } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress: walletAddress,
  })

  const {
    data: rewardsData,
    isLoading: isRewardsLoading,
    error: rewardsError,
  } = useGetPoolsRewards({ walletAddress, chainIds }, Boolean(walletAddress))

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
    setTokenRewards(rawRewards)
  }, [rawRewards, setTokenRewards])

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
          <Button
            emphasis="secondary"
            size="small"
            maxWidth="fit-content"
            disabled={!userHasRewards || Boolean(rewardsError)}
            onPress={onCollectRewards}
          >
            {t('common.collect.button')}
          </Button>
        }
      >
        <Flex row gap="$spacing8" alignItems="center">
          <Image src={tokenLogo} width={24} height={24} objectFit="cover" />
          <ChipValue isLoading={isRewardsLoading}>
            {rewardsError
              ? '-'
              : (formattedRewardsUsdValue ?? convertFiatAmountFormatted(0, NumberType.PortfolioBalance))}
          </ChipValue>
        </Flex>
      </SummaryChip>
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
