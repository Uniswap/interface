import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexLoader, Image, Skeleton, Text, TouchableArea } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes } from 'ui/src/theme'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import tokenLogo from '~/assets/images/token-logo.png'
import { useLpIncentives } from '~/features/Liquidity/hooks/useLpIncentives'
import { LP_INCENTIVES_CHAIN_IDS, LP_INCENTIVES_DUST_THRESHOLD } from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'
import { useLpIncentiveRewardsUsdValue } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewardsUsdValue'
import { LpIncentiveClaimModal } from '~/features/Liquidity/LPIncentives/LpIncentiveClaimModal'
import { PortfolioPoolsSidebarCard } from '~/pages/Portfolio/Pools/components/PortfolioPoolsSidebarCard'

export function PortfolioPoolsRewardsCard({
  walletAddress,
  isExternalWallet = false,
}: {
  walletAddress: string | undefined
  isExternalWallet?: boolean
}) {
  const { t } = useTranslation()

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

  const {
    data: rewardsData,
    isLoading,
    error,
  } = useGetPoolsRewards({ walletAddress, chainIds: LP_INCENTIVES_CHAIN_IDS }, Boolean(walletAddress))

  const effectivelyClaimed = useEffectivelyClaimed({
    tokenRewards: rewardsData?.totalUnclaimedAmountUni,
    hasCollectedRewards,
  })

  const { userHasRewards, isParseError } = useMemo(() => {
    if (effectivelyClaimed) {
      return { userHasRewards: false, isParseError: false }
    }
    try {
      const raw = rewardsData?.totalUnclaimedAmountUni ?? '0'
      return { userHasRewards: BigInt(raw) >= LP_INCENTIVES_DUST_THRESHOLD, isParseError: false }
    } catch (e) {
      logger.error(e, {
        tags: { file: 'PortfolioPoolsRewardsCard.tsx', function: 'userHasRewards' },
      })
      return { userHasRewards: false, isParseError: true }
    }
  }, [effectivelyClaimed, rewardsData?.totalUnclaimedAmountUni])

  const { usdValue: rewardsUsdValue, formattedUsdValue: formattedRewardsUsdValue } = useLpIncentiveRewardsUsdValue(
    effectivelyClaimed ? '0' : (rewardsData?.totalUnclaimedAmountUni ?? '0'),
  )
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const hasError = Boolean(error) || isParseError
  const isUsdLoading = userHasRewards && !rewardsUsdValue

  useEffect(() => {
    setTokenRewards(effectivelyClaimed ? '0' : (rewardsData?.totalUnclaimedAmountUni ?? '0'))
  }, [effectivelyClaimed, rewardsData?.totalUnclaimedAmountUni, setTokenRewards])

  const handleClaimSuccess = useCallback(() => {
    sendAnalyticsEvent(UniswapEventName.LpIncentiveCollectRewardsSuccess, {
      token_rewards: tokenRewards,
    })
    onTransactionSuccess()
  }, [tokenRewards, onTransactionSuccess])

  if (!walletAddress) {
    return null
  }

  const showSkeleton = isLoading || isUsdLoading
  const isZero = !showSkeleton && !hasError && !userHasRewards

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
          <Image src={tokenLogo} width={iconSizes.icon24} height={iconSizes.icon24} objectFit="cover" flexShrink={0} />
          {showSkeleton ? (
            <Flex flexGrow={1}>
              <Skeleton>
                <FlexLoader borderRadius="$rounded12" height={24} width={100} opacity={0.4} />
              </Skeleton>
            </Flex>
          ) : (
            <Flex flexGrow={1}>
              <AnimatedNumber
                value={
                  hasError
                    ? '-'
                    : (formattedRewardsUsdValue ?? convertFiatAmountFormatted('0', NumberType.PortfolioBalance))
                }
                numericValue={rewardsUsdValue ? Number(rewardsUsdValue.toExact()) : 0}
                textVariant="$heading3"
                color={userHasRewards || hasError ? '$neutral1' : '$neutral3'}
              />
            </Flex>
          )}
          {!isZero && !showSkeleton && !isExternalWallet && (
            <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveCollectRewardsButtonClicked}>
              <Button
                size="xsmall"
                emphasis="secondary"
                fill={false}
                disabled={hasError || isPendingTransaction}
                onPress={openModal}
              >
                {t('common.collect.button')}
              </Button>
            </Trace>
          )}
        </Flex>
      </PortfolioPoolsSidebarCard>
      <LpIncentiveClaimModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={handleClaimSuccess}
        tokenRewards={tokenRewards}
        isPendingTransaction={isPendingTransaction}
        iconUrl={tokenLogo}
        formattedRewardsUsdValue={formattedRewardsUsdValue}
      />
    </>
  )
}
