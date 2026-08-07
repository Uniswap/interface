import type { Token } from '@uniswap/sdk-core'
import { HexString } from '@universe/encoding'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  Button,
  Flex,
  FlexLoader,
  FlexProps,
  Image,
  Skeleton,
  Text,
  TouchableArea,
  useIsDarkMode,
  useMedia,
  useShadowPropsMedium,
  useShadowPropsShort,
} from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes } from 'ui/src/theme'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useGetPoolsRewards } from 'uniswap/src/data/apiClients/dataApiService/pools/getPoolsRewards'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import dottedBackgroundDark from '~/assets/images/dotted-grid-dark.png'
import dottedBackground from '~/assets/images/dotted-grid.png'
import tokenLogo from '~/assets/images/token-logo.png'
import { formatRewardsTotal, type RewardTokenRef } from '~/features/Liquidity/LPIncentives/buildLpIncentiveRewards'
import {
  LP_INCENTIVES_CHAIN_IDS,
  LP_INCENTIVES_DUST_THRESHOLD,
  LP_INCENTIVES_POOLS_CHAIN_ID,
  LP_INCENTIVES_REWARD_TOKEN,
} from '~/features/Liquidity/LPIncentives/constants'
import { useEffectivelyClaimed } from '~/features/Liquidity/LPIncentives/hooks/useEffectivelyClaimed'
import { useLpIncentiveRewards } from '~/features/Liquidity/LPIncentives/hooks/useLpIncentiveRewards'
import { LpIncentiveRewardLogos } from '~/features/Liquidity/LPIncentives/LpIncentiveRewardLogos'
import { LpIncentivesRewardsModal } from '~/features/Liquidity/LPIncentives/LpIncentivesRewardsModal'
import { formatTokenAmount } from '~/features/Liquidity/LPIncentives/utils/formatTokenAmount'
import { getChainUrlParam } from '~/utils/params/chainParams'

interface LpIncentiveRewardsCardProps {
  walletAddress?: HexString
  /** UNI-only path: the page owns the claim modal and emits the Collect funnel event. */
  onCollectRewards: () => void
  /** UNI-only path: feeds the page's tokenRewards state, which the UNI-only claim modal reads. */
  setTokenRewards: (value: string) => void
  initialHasCollectedRewards: boolean
  token?: Token
  chainIds?: number[]
}

/**
 * The UNI-only reward read: unclaimed UNI formatted for display, whether it clears the dust
 * threshold, and the page-state sync the UNI-only claim modal depends on. Disabled by
 * `isMultiTokenEnabled` so the multi-token path doesn't fetch a result it never renders.
 */
function useUniRewards({
  walletAddress,
  chainIds,
  token,
  setTokenRewards,
  initialHasCollectedRewards,
  isMultiTokenEnabled,
}: {
  walletAddress?: HexString
  chainIds: number[]
  token: Token
  setTokenRewards: (value: string) => void
  initialHasCollectedRewards: boolean
  isMultiTokenEnabled: boolean
}): { amountText: string; userHasRewards: boolean; hasError: boolean; isLoading: boolean } {
  const { data, isLoading, error } = useGetPoolsRewards(
    { walletAddress, chainIds },
    Boolean(walletAddress) && !isMultiTokenEnabled,
  )
  const totalUnclaimed = data?.totalUnclaimedAmountUni
  const effectivelyClaimed = useEffectivelyClaimed({
    tokenRewards: totalUnclaimed,
    hasCollectedRewards: initialHasCollectedRewards,
  })

  const { amountText, userHasRewards, isParseRewardsError } = useMemo(() => {
    if (effectivelyClaimed) {
      return { amountText: '0', userHasRewards: false, isParseRewardsError: false }
    }

    try {
      const rewards = totalUnclaimed ?? '0'

      return {
        amountText: formatTokenAmount(rewards, token.decimals),
        userHasRewards: BigInt(rewards) >= LP_INCENTIVES_DUST_THRESHOLD,
        isParseRewardsError: false,
      }
    } catch (e) {
      logger.error(e, { tags: { file: 'LpIncentiveRewardsCard.tsx', function: 'useUniRewards' } })

      return { amountText: '-', userHasRewards: false, isParseRewardsError: true }
    }
  }, [effectivelyClaimed, totalUnclaimed, token.decimals])

  useEffect(() => {
    // Nothing reads the page's tokenRewards on the multi-token path — the UNI-only claim modal it
    // feeds isn't rendered there — and that path has no UNI amount to report.
    if (isMultiTokenEnabled) {
      return
    }
    // If rewards have been claimed, set token rewards to 0
    setTokenRewards(effectivelyClaimed ? '0' : (totalUnclaimed ?? '0'))
  }, [totalUnclaimed, setTokenRewards, effectivelyClaimed, isMultiTokenEnabled])

  return { amountText, userHasRewards, hasError: Boolean(error) || isParseRewardsError, isLoading }
}

/** Amount slot: a USD total plus a reward-logo cluster, or an unclaimed UNI amount plus the UNI logo. */
function RewardsAmount({
  isMultiTokenEnabled,
  isLoading,
  hasError,
  isSmallScreen,
  usdTotal,
  rewardTokens,
  uniAmountText,
  userHasRewards,
  tokenSymbol,
}: {
  isMultiTokenEnabled: boolean
  isLoading: boolean
  hasError: boolean
  isSmallScreen: boolean
  usdTotal: string
  rewardTokens: RewardTokenRef[]
  uniAmountText: string
  userHasRewards: boolean
  tokenSymbol?: string
}): JSX.Element {
  const amountVariant = isSmallScreen ? 'subheading1' : 'heading2'
  const logoSize = isSmallScreen ? iconSizes.icon24 : iconSizes.icon28

  if (isLoading) {
    return (
      <Skeleton>
        <FlexLoader
          borderRadius="$rounded4"
          height={isSmallScreen ? 20 : 36}
          opacity={0.4}
          width={isSmallScreen ? 46 : 100}
          marginBottom="$spacing4"
        />
      </Skeleton>
    )
  }

  if (isMultiTokenEnabled) {
    // usdTotal is already UNKNOWN_REWARDS_TOTAL ("-") on a failed fetch, which is what the UNI-only
    // path renders in its error state — so no separate error branch is needed.
    return (
      <>
        <Text variant={amountVariant} color="$neutral1">
          {usdTotal}
        </Text>
        {!hasError && rewardTokens.length > 0 && <LpIncentiveRewardLogos tokens={rewardTokens} size={logoSize} />}
      </>
    )
  }

  return (
    <>
      <Text variant={amountVariant} color={!hasError && userHasRewards ? '$accent1' : '$neutral1'}>
        {hasError ? '-' : `${uniAmountText} ${tokenSymbol}`}
      </Text>
      {!hasError && <Image src={tokenLogo} width={logoSize} height={logoSize} objectFit="cover" />}
    </>
  )
}

/**
 * Positions-page LP-incentive rewards card.
 *
 * multi_token_lp_incentives switches what the card reports and how it collects. With the flag off it
 * shows an unclaimed UNI amount and hands Collect back to the page, which owns the UNI-only claim
 * modal. With the flag on it shows an aggregate USD total across every reward denomination with a
 * cluster of reward-token logos, and Collect opens the wallet-level rewards modal it owns itself.
 *
 * The frame is shared, so the flag only picks values inside it. `onCollectRewards`,
 * `setTokenRewards` and `initialHasCollectedRewards` are inert on the multi-token path; the page
 * passes them unconditionally rather than branching at the call site.
 */
export function LpIncentiveRewardsCard({
  walletAddress,
  onCollectRewards,
  setTokenRewards,
  initialHasCollectedRewards,
  token = LP_INCENTIVES_REWARD_TOKEN,
  chainIds = LP_INCENTIVES_CHAIN_IDS,
}: LpIncentiveRewardsCardProps) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const navigate = useNavigate()
  const shadowPropsShort = useShadowPropsShort()
  const shadowPropsMedium = useShadowPropsMedium()
  const isDarkMode = useIsDarkMode()
  const media = useMedia()
  const isSmallScreen = media.sm
  const isMultiTokenEnabled = useFeatureFlag(FeatureFlags.MultiTokenLpIncentives)

  // Both reads stay mounted so the hook order is stable, but only the active one fetches: the
  // UNI-only query is disabled by flag, and the multi-token surface keys its query on having an
  // address, so withholding it keeps GetRewards from firing for a result nothing renders.
  const uni = useUniRewards({
    walletAddress,
    chainIds,
    token,
    setTokenRewards,
    initialHasCollectedRewards,
    isMultiTokenEnabled,
  })
  const {
    rewardTokens,
    hasRewards: hasMultiTokenRewards,
    isLoading: isMultiTokenLoading,
    isError: isMultiTokenError,
    ...multiTokenRewards
  } = useLpIncentiveRewards(isMultiTokenEnabled ? walletAddress : undefined)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const openModal = useEvent(() => setIsModalOpen(true))
  const closeModal = useEvent(() => setIsModalOpen(false))
  const formattedTotalUsd = formatRewardsTotal(
    { isError: isMultiTokenError, totalUsd: multiTokenRewards.totalUsd },
    convertFiatAmountFormatted,
  )

  const navigateToEligiblePools = useCallback(() => {
    navigate(`/explore/pools/${getChainUrlParam(LP_INCENTIVES_POOLS_CHAIN_ID)}`)
  }, [navigate])

  const hasError = isMultiTokenEnabled ? isMultiTokenError : uni.hasError
  const isLoading = isMultiTokenEnabled ? isMultiTokenLoading : uni.isLoading
  const isCollectDisabled = isMultiTokenEnabled ? !hasMultiTokenRewards : !uni.userHasRewards || uni.hasError

  const collectButton = (
    <Button
      emphasis="primary"
      size={isSmallScreen ? 'xxsmall' : 'small'}
      maxWidth="fit-content"
      onPress={isMultiTokenEnabled ? openModal : onCollectRewards}
      borderColor={isCollectDisabled ? '$neutral3' : 'unset'}
      disabled={isCollectDisabled}
    >
      {t('pool.incentives.collectRewards')}
    </Button>
  )

  return (
    <Flex group cursor="default">
      <Flex
        height={isSmallScreen ? 142 : 192}
        p={isSmallScreen ? '$spacing16' : '$spacing24'}
        justifyContent="space-between"
        backgroundColor="$surface2"
        borderWidth="$spacing1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        overflow="hidden"
        transition="all 0.2s ease-out"
        $group-hover={shadowPropsMedium['$platform-web'] as FlexProps}
        {...shadowPropsShort}
      >
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          background={`url(${isDarkMode ? dottedBackground : dottedBackgroundDark})`}
          backgroundPosition="center"
          backgroundSize="100% 100%"
          backgroundRepeat="no-repeat"
          transition="transform 0.2s ease-out"
          $group-hover={{ transform: 'scale(1.2)' }}
        />
        <Flex row justifyContent="space-between">
          <Flex width="100%" gap="$spacing2">
            <Flex row justifyContent="space-between">
              <Flex row gap="$spacing8" alignItems="center">
                <RewardsAmount
                  isMultiTokenEnabled={isMultiTokenEnabled}
                  isLoading={isLoading}
                  hasError={hasError}
                  isSmallScreen={isSmallScreen}
                  usdTotal={formattedTotalUsd}
                  rewardTokens={rewardTokens}
                  uniAmountText={uni.amountText}
                  userHasRewards={uni.userHasRewards}
                  tokenSymbol={token.symbol}
                />
              </Flex>
              {/* The UNI-only path emits this event from the page's Collect handler, so the Trace
                  is multi-token only — wrapping both would double-count the funnel. */}
              {isMultiTokenEnabled ? (
                <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveCollectRewardsButtonClicked}>
                  {collectButton}
                </Trace>
              ) : (
                collectButton
              )}
            </Flex>
            <Flex row gap="$spacing6">
              <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral2">
                {hasError
                  ? t('pool.incentives.yourRewards.error')
                  : isMultiTokenEnabled
                    ? t('pool.positions.summary.totalRewards')
                    : t('pool.incentives.rewardsEarned')}
              </Text>
              {!isMobileWeb && (
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
                          : t('pool.incentives.administeredRewards')}
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
          </Flex>
        </Flex>
        <Flex gap="$spacing2">
          <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
            <TouchableArea
              group="item"
              animation={null}
              row
              gap="$spacing6"
              alignItems="center"
              hoverStyle={{ opacity: 0.8 }}
              onPress={navigateToEligiblePools}
              alignSelf="flex-start"
            >
              <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral1">
                {t('pool.incentives.findMore')}
              </Text>
              <Flex transition="all 0.1s ease-in-out" enterStyle={{ x: 0 }} x={0} $group-item-hover={{ x: 4 }}>
                <ArrowRight color="$neutral1" size={isSmallScreen ? iconSizes.icon12 : iconSizes.icon16} />
              </Flex>
            </TouchableArea>
          </Trace>
          <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral2">
            {t('pool.incentives.eligible')}
          </Text>
        </Flex>
      </Flex>
      {isMultiTokenEnabled && (
        <LpIncentivesRewardsModal isOpen={isModalOpen} onClose={closeModal} walletAddress={walletAddress} />
      )}
    </Flex>
  )
}
