import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, Image, Skeleton, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useGetPoolsRewards } from 'uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import tokenLogo from '~/assets/images/token-logo.png'
import { useLpIncentives } from '~/features/Liquidity/hooks/useLpIncentives'
import { formatRewardsTotal } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import { LP_INCENTIVES_CHAIN_IDS, LP_INCENTIVES_DUST_THRESHOLD } from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { useLpIncentiveRewardsUsdValue } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue'
import { LpIncentiveClaimModal } from '~/features/Liquidity/LPIncentives/LpIncentiveClaimModal'
import { LpIncentiveRewardLogos } from '~/features/Liquidity/LPIncentives/LpIncentiveRewardLogos'
import { LpIncentivesRewardsModal } from '~/features/Liquidity/LPIncentives/LpIncentivesRewardsModal'
import { PortfolioPoolsSidebarCard } from '~/pages/Portfolio/Pools/components/PortfolioPoolsSidebarCard'

/**
 * The UNI-only reward read for this card: whether the wallet clears the dust threshold, the USD
 * conversion of its unclaimed UNI, and the claim-modal state it owns. Disabled by
 * `isMultiTokenEnabled` so the multi-token path doesn't fetch a result it never renders.
 */
function useUniPortfolioRewards({
  walletAddress,
  isMultiTokenEnabled,
}: {
  walletAddress?: string
  isMultiTokenEnabled: boolean
}) {
  const {
    isModalOpen,
    isPendingTransaction,
    tokenRewards,
    openModal,
    closeModal,
    setTokenRewards,
    onTransactionSuccess,
    hasCollectedRewards,
  } = useLpIncentives()

  const { data, isLoading, error } = useGetPoolsRewards(
    { walletAddress, chainIds: LP_INCENTIVES_CHAIN_IDS },
    Boolean(walletAddress) && !isMultiTokenEnabled,
  )
  const totalUnclaimed = data?.totalUnclaimedAmountUni

  const effectivelyClaimed = useEffectivelyClaimed({ tokenRewards: totalUnclaimed, hasCollectedRewards })

  const { userHasRewards, isParseError } = useMemo(() => {
    if (effectivelyClaimed) {
      return { userHasRewards: false, isParseError: false }
    }
    try {
      const raw = totalUnclaimed ?? '0'
      return { userHasRewards: BigInt(raw) >= LP_INCENTIVES_DUST_THRESHOLD, isParseError: false }
    } catch (e) {
      logger.error(e, { tags: { file: 'PortfolioPoolsRewardsCard.tsx', function: 'userHasRewards' } })
      return { userHasRewards: false, isParseError: true }
    }
  }, [effectivelyClaimed, totalUnclaimed])

  const { usdValue, formattedUsdValue } = useLpIncentiveRewardsUsdValue(
    effectivelyClaimed ? '0' : (totalUnclaimed ?? '0'),
  )

  useEffect(() => {
    // The multi-token path renders no UNI amount and its modal doesn't read this page state.
    if (isMultiTokenEnabled) {
      return
    }
    setTokenRewards(effectivelyClaimed ? '0' : (totalUnclaimed ?? '0'))
  }, [effectivelyClaimed, totalUnclaimed, setTokenRewards, isMultiTokenEnabled])

  const handleClaimSuccess = useCallback(() => {
    sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsSuccess, { token_rewards: tokenRewards })
    onTransactionSuccess()
  }, [tokenRewards, onTransactionSuccess])

  return {
    userHasRewards,
    hasError: Boolean(error) || isParseError,
    // A known reward with no USD price yet is still loading as far as this card's amount slot goes.
    isLoading: isLoading || (userHasRewards && !usdValue),
    usdValue,
    formattedUsdValue,
    isModalOpen,
    isPendingTransaction,
    tokenRewards,
    openModal,
    closeModal,
    handleClaimSuccess,
  }
}

/**
 * Portfolio pools sidebar rewards card.
 *
 * multi_token_lp_incentives switches what the card totals and how it collects. With the flag off it
 * shows the USD value of unclaimed UNI beside the UNI logo and Collect opens the UNI-only claim
 * modal. With the flag on it totals every reward denomination, shows a cluster of reward-token
 * logos, and Collect opens the wallet-level rewards modal.
 */
export function PortfolioPoolsRewardsCard({
  walletAddress,
  isExternalWallet = false,
}: {
  walletAddress: string | undefined
  isExternalWallet?: boolean
}) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isMultiTokenEnabled = useFeatureFlag(FeatureFlags.MultiTokenLpIncentives)

  const uni = useUniPortfolioRewards({ walletAddress, isMultiTokenEnabled })
  const multi = useLpIncentiveRewards(isMultiTokenEnabled ? walletAddress : undefined)
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false)
  const openRewardsModal = useEvent(() => setIsRewardsModalOpen(true))
  const closeRewardsModal = useEvent(() => setIsRewardsModalOpen(false))

  if (!walletAddress) {
    return null
  }

  const hasRewards = isMultiTokenEnabled ? multi.hasRewards : uni.userHasRewards
  const hasError = isMultiTokenEnabled ? multi.isError : uni.hasError
  const showSkeleton = isMultiTokenEnabled ? multi.isLoading : uni.isLoading
  // A failed fetch isn't a zero balance, so it keeps the tooltip and the (disabled) Collect button
  // that the zero state drops.
  const isZero = !showSkeleton && !hasError && !hasRewards
  const displayValue = isMultiTokenEnabled
    ? formatRewardsTotal(multi, convertFiatAmountFormatted)
    : hasError
      ? '-'
      : (uni.formattedUsdValue ?? convertFiatAmountFormatted('0', NumberType.PortfolioBalance))
  const numericValue = isMultiTokenEnabled ? multi.totalUsd : uni.usdValue ? Number(uni.usdValue.toExact()) : 0

  return (
    <>
      <PortfolioPoolsSidebarCard gap="$gap8">
        <Flex row gap="$gap4" alignItems="center">
          <Text variant="body3" color="$neutral2">
            {t('pool.rewards')}
          </Text>
          {!isZero && (
            <InfoTooltip
              placement="top"
              trigger={
                <TouchableArea>
                  <InfoCircleFilled color="$neutral3" size="$icon.16" />
                </TouchableArea>
              }
              text={
                <Flex gap="$spacing4">
                  <Text variant="body4" color="$neutral1">
                    {hasError
                      ? t('pool.incentives.yourRewards.error.description')
                      : t('pool.incentives.administeredRewards.portfolio')}
                  </Text>
                  {!hasError && (
                    <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
                      <LearnMoreLink textVariant="buttonLabel4" url={UniswapHelpUrls.articles.lpIncentiveInfo} />
                    </Trace>
                  )}
                </Flex>
              }
            />
          )}
        </Flex>
        <Flex row alignItems="center" gap="$gap8" minHeight={32}>
          {isMultiTokenEnabled ? (
            multi.rewardTokens.length > 0 && <LpIncentiveRewardLogos tokens={multi.rewardTokens} />
          ) : (
            <Image
              src={tokenLogo}
              width={iconSizes.icon24}
              height={iconSizes.icon24}
              objectFit="cover"
              flexShrink={0}
            />
          )}
          {showSkeleton ? (
            <Flex flexGrow={1}>
              <Skeleton>
                <FlexLoader borderRadius="$rounded12" height={24} width={100} opacity={0.4} />
              </Skeleton>
            </Flex>
          ) : (
            <Flex flexGrow={1}>
              {/* An unknown balance reads as present rather than absent, so a failed fetch keeps the
                  full-strength colour the zero state greys out. */}
              <AnimatedNumber
                value={displayValue}
                numericValue={numericValue}
                textVariant="$heading3"
                color={hasRewards || hasError ? '$neutral1' : '$neutral3'}
              />
            </Flex>
          )}
          {!isZero && !showSkeleton && !isExternalWallet && (
            <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveCollectRewardsButtonClicked}>
              <Button
                size="xsmall"
                emphasis="secondary"
                fill={false}
                disabled={isMultiTokenEnabled ? !hasRewards : hasError || uni.isPendingTransaction}
                onPress={isMultiTokenEnabled ? openRewardsModal : uni.openModal}
              >
                {t('common.collect.button')}
              </Button>
            </Trace>
          )}
        </Flex>
      </PortfolioPoolsSidebarCard>
      {isMultiTokenEnabled ? (
        <LpIncentivesRewardsModal
          isOpen={isRewardsModalOpen}
          onClose={closeRewardsModal}
          walletAddress={walletAddress}
        />
      ) : (
        <LpIncentiveClaimModal
          isOpen={uni.isModalOpen}
          onClose={uni.closeModal}
          onSuccess={uni.handleClaimSuccess}
          tokenRewards={uni.tokenRewards}
          isPendingTransaction={uni.isPendingTransaction}
          iconUrl={tokenLogo}
          formattedRewardsUsdValue={uni.formattedUsdValue}
        />
      )}
    </>
  )
}
