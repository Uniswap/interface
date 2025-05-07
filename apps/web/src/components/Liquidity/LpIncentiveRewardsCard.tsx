import type { Token } from '@uniswap/sdk-core'
import dottedBackgroundDark from 'assets/images/dotted-grid-dark.png'
import dottedBackground from 'assets/images/dotted-grid.png'
import tokenLogo from 'assets/images/token-logo.png'
import { formatTokenAmount } from 'components/Liquidity/utils'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
import { UNI } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useGetPoolsRewards } from 'uniswap/src/data/rest/getPoolsRewards'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { isMobileWeb } from 'utilities/src/platform'

interface LpIncentiveRewardsCardProps {
  onCollectRewards: () => void
  walletAddress?: `0x${string}`
  token?: Token
  chainIds?: number[]
  setTokenRewards: (value: string) => void
  hasCollectedRewards: boolean
}

function LpIncentiveRewardsCard({
  onCollectRewards,
  token = UNI[UniverseChainId.Mainnet],
  walletAddress,
  chainIds = [UniverseChainId.Mainnet as number],
  setTokenRewards,
  hasCollectedRewards,
}: LpIncentiveRewardsCardProps) {
  const { t } = useTranslation()
  const shadowPropsShort = useShadowPropsShort()
  const shadowPropsMedium = useShadowPropsMedium()
  const isDarkMode = useIsDarkMode()
  const media = useMedia()
  const isSmallScreen = media.sm
  const showRewards = !!walletAddress

  const {
    data: rewardsData,
    isLoading,
    error,
  } = useGetPoolsRewards({ walletAddress, chainIds }, Boolean(walletAddress))

  // TODO | LP_INCENTIVES: determine number of decimals to show in claim modal
  // Also determine what constitutes a claimable amount (i.e. is 0.0001 a claimable amount?)
  const { lpIncentiveRewards, userHasRewards } = useMemo(() => {
    // If rewards have been claimed, return 0 regardless of fetched data
    if (hasCollectedRewards) {
      return {
        lpIncentiveRewards: '0',
        userHasRewards: false,
      }
    }

    const rewards = rewardsData?.totalUnclaimedAmountUni ?? '0'
    return {
      lpIncentiveRewards: formatTokenAmount(rewards, token.decimals),
      userHasRewards: BigInt(rewards) > BigInt(0),
    }
  }, [rewardsData?.totalUnclaimedAmountUni, token.decimals, hasCollectedRewards])

  useEffect(() => {
    // If rewards have been claimed, set token rewards to 0
    if (hasCollectedRewards) {
      setTokenRewards('0')
      return
    }

    const rewards = rewardsData?.totalUnclaimedAmountUni ?? '0'
    setTokenRewards(rewards)
  }, [rewardsData?.totalUnclaimedAmountUni, setTokenRewards, hasCollectedRewards])

  const renderRewardsAmount = () => {
    if (isLoading) {
      return (
        <Skeleton>
          <FlexLoader
            borderRadius="$rounded4"
            height={isSmallScreen ? 20 : 40}
            opacity={0.4}
            width={isSmallScreen ? 46 : 100}
            marginBottom="$spacing4"
          />
        </Skeleton>
      )
    }

    if (error) {
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
    <TouchableArea group cursor="default">
      <Flex
        height={showRewards ? (isSmallScreen ? 142 : 192) : 95}
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
        {showRewards && (
          <Flex row justifyContent="space-between">
            <Flex width="100%" gap="$spacing2">
              <Flex row justifyContent="space-between">
                <Flex row gap="$spacing8" alignItems="center">
                  {renderRewardsAmount()}
                  {!error && (
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
                  isDisabled={Boolean(!userHasRewards || error)}
                >
                  {t('pool.incentives.collectRewards')}
                </Button>
              </Flex>
              <Flex row gap="$spacing6">
                <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral2">
                  {error ? t('pool.incentives.yourRewards.error') : t('pool.incentives.rewardsEarned')}
                </Text>
                {!isMobileWeb && (
                  <InfoTooltip
                    placement="top"
                    trigger={
                      <TouchableArea>
                        <InfoCircleFilled color="$neutral3" size={iconSizes.icon16} />
                      </TouchableArea>
                    }
                    text={
                      <Flex gap="$spacing4">
                        <Text variant="body4" color="$neutral1">
                          {error
                            ? t('pool.incentives.yourRewards.error.description')
                            : t('pool.incentives.administeredRewards')}
                        </Text>
                        {!error && (
                          <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
                            <LearnMoreLink
                              textVariant="buttonLabel4"
                              url={uniswapUrls.helpArticleUrls.lpIncentiveInfo}
                            />
                          </Trace>
                        )}
                      </Flex>
                    }
                  />
                )}
              </Flex>
            </Flex>
          </Flex>
        )}
        <Flex gap="$spacing2">
          <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
            <TouchableArea onPress={() => window.open(uniswapUrls.helpArticleUrls.lpIncentiveInfo, '_blank')}>
              <Flex group="item" row gap="$spacing6" alignItems="center" hoverStyle={{ opacity: 0.8 }}>
                <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral1">
                  {t('pool.incentives.uni.findMore')}
                </Text>
                <Flex transition="fast" $group-item-hover={{ transform: 'translateX(2px)' }}>
                  <ArrowRight color="$neutral1" size={isSmallScreen ? iconSizes.icon12 : iconSizes.icon16} />
                </Flex>
              </Flex>
            </TouchableArea>
          </Trace>
          <Text variant={isSmallScreen ? 'body4' : 'body3'} color="$neutral2">
            {t('pool.incentives.eligible')}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export default LpIncentiveRewardsCard
