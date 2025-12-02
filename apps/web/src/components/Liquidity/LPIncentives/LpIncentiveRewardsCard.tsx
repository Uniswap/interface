import type { Token } from '@uniswap/sdk-core'
import dottedBackground from 'assets/images/dotted-grid.png'
import dottedBackgroundDark from 'assets/images/dotted-grid-dark.png'
import tokenLogo from 'assets/images/token-logo.png'
import { formatTokenAmount } from 'components/Liquidity/LPIncentives/utils/formatTokenAmount'
import { LP_INCENTIVES_REWARD_TOKEN } from 'components/LpIncentives/constants'
import { lpIncentivesLastClaimedAtom } from 'hooks/useLpIncentives'
import { useAtom } from 'jotai'
import ms from 'ms'
import { useEffect, useMemo } from 'react'
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
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { HexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { isMobileWeb } from 'utilities/src/platform'

interface LpIncentiveRewardsCardProps {
  onCollectRewards: () => void
  walletAddress?: HexString
  token?: Token
  chainIds?: number[]
  setTokenRewards: (value: string) => void
  initialHasCollectedRewards: boolean
}

const FIVE_MINUTES_MS = ms('5m')

function LpIncentiveRewardsCard({
  onCollectRewards,
  token = LP_INCENTIVES_REWARD_TOKEN,
  walletAddress,
  chainIds = [UniverseChainId.Mainnet as number],
  setTokenRewards,
  initialHasCollectedRewards,
}: LpIncentiveRewardsCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const shadowPropsShort = useShadowPropsShort()
  const shadowPropsMedium = useShadowPropsMedium()
  const isDarkMode = useIsDarkMode()
  const media = useMedia()
  const isSmallScreen = media.sm

  const {
    data: rewardsData,
    isLoading,
    error,
  } = useGetPoolsRewards({ walletAddress, chainIds }, Boolean(walletAddress))

  const [lastClaimed, setLastClaimed] = useAtom(lpIncentivesLastClaimedAtom)

  // TODO: refactor business logic into separate hook
  // Determine if rewards are effectively claimed, considering initial state and recent optimistic updates
  const effectivelyClaimed = useMemo(() => {
    if (initialHasCollectedRewards) {
      return true
    }
    if (!lastClaimed || !rewardsData?.totalUnclaimedAmountUni) {
      return false
    }

    const timeDiff = Date.now() - lastClaimed.timestamp

    return timeDiff < FIVE_MINUTES_MS && rewardsData.totalUnclaimedAmountUni === lastClaimed.amount
  }, [initialHasCollectedRewards, lastClaimed, rewardsData?.totalUnclaimedAmountUni])

  const { lpIncentiveRewards, userHasRewards, isParseRewardsError } = useMemo(() => {
    if (effectivelyClaimed) {
      return {
        lpIncentiveRewards: '0',
        userHasRewards: false,
        isParseRewardsError: false,
      }
    }

    try {
      const threshold = BigInt(10) ** BigInt(token.decimals - 3)
      const rewards = rewardsData?.totalUnclaimedAmountUni ?? '0'

      return {
        lpIncentiveRewards: formatTokenAmount(rewards, token.decimals),
        userHasRewards: BigInt(rewards) >= threshold, // Returns true if rewards are at least 0.001 UNI
        isParseRewardsError: false,
      }
    } catch (e) {
      logger.error(e, {
        tags: { file: 'LpIncentiveRewardsCard.tsx', function: 'lpIncentiveRewards' },
      })

      return {
        lpIncentiveRewards: '-',
        userHasRewards: false,
        isParseRewardsError: true,
      }
    }
  }, [effectivelyClaimed, rewardsData?.totalUnclaimedAmountUni, token.decimals])

  const isCollectButtonDisabled = useMemo(() => Boolean(!userHasRewards || error), [userHasRewards, error])

  useEffect(() => {
    // If rewards have been claimed, set token rewards to 0
    if (effectivelyClaimed) {
      setTokenRewards('0')
      return
    }

    const rewards = rewardsData?.totalUnclaimedAmountUni ?? '0'
    setTokenRewards(rewards)
  }, [rewardsData?.totalUnclaimedAmountUni, setTokenRewards, effectivelyClaimed])

  // Clear last claimed from local storage if timestamp past expiration
  useEffect(() => {
    if (lastClaimed && Date.now() - lastClaimed.timestamp > FIVE_MINUTES_MS) {
      setLastClaimed(null)
    }
  }, [lastClaimed, setLastClaimed])

  const rewardsError = useMemo((): boolean => {
    return !!error || isParseRewardsError
  }, [error, isParseRewardsError])

  const renderRewardsAmount = () => {
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

    if (rewardsError) {
      return (
        <Text variant={isSmallScreen ? 'subheading1' : 'heading2'} color="$neutral1">
          -
        </Text>
      )
    }

    return (
      <Text variant={isSmallScreen ? 'subheading1' : 'heading2'} color={userHasRewards ? '$accent1' : '$neutral1'}>
        {lpIncentiveRewards} {token.symbol}
      </Text>
    )
  }

  return (
    <Flex group cursor="default">
      <Flex
        height={isSmallScreen ? 142 : 192}
        p={isSmallScreen ? '$spacing16' : '$spacing24'}
        justifyContent="space-between"
        backgroundColor="$surface2"
        borderWidth={1}
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
                {renderRewardsAmount()}
                {!rewardsError && (
                  <Image
                    src={tokenLogo}
                    width={isSmallScreen ? 24 : 28}
                    height={isSmallScreen ? 24 : 28}
                    objectFit="cover"
                  />
                )}
              </Flex>
              <Button
                emphasis="primary"
                size={isSmallScreen ? 'xxsmall' : 'small'}
                maxWidth="fit-content"
                onPress={onCollectRewards}
                borderColor={isCollectButtonDisabled ? '$neutral3' : 'unset'}
                isDisabled={isCollectButtonDisabled}
              >
                {t('pool.incentives.collectRewards')}
              </Button>
            </Flex>
            <Flex row gap="$spacing6">
              <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral2">
                {rewardsError ? t('pool.incentives.yourRewards.error') : t('pool.incentives.rewardsEarned')}
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
                        {rewardsError
                          ? t('pool.incentives.yourRewards.error.description')
                          : t('pool.incentives.administeredRewards')}
                      </Text>
                      {!rewardsError && (
                        <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
                          <LearnMoreLink textVariant="buttonLabel4" url={uniswapUrls.helpArticleUrls.lpIncentiveInfo} />
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
              row
              gap="$spacing6"
              alignItems="center"
              hoverStyle={{ opacity: 0.8 }}
              onPress={() => navigate('/explore/pools')}
              alignSelf="flex-start"
            >
              <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral1">
                {t('pool.incentives.uni.findMore')}
              </Text>
              <Flex animation="simple" enterStyle={{ x: 0 }} x={0} $group-item-hover={{ x: 4 }}>
                <ArrowRight color="$neutral1" size={isSmallScreen ? iconSizes.icon12 : iconSizes.icon16} />
              </Flex>
            </TouchableArea>
          </Trace>
          <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral2">
            {t('pool.incentives.eligible')}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default LpIncentiveRewardsCard
