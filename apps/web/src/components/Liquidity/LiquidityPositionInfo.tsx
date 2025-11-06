import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import {
  LiquidityPositionStatusIndicator,
  LiquidityPositionStatusIndicatorLoader,
} from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { TextLoader } from 'components/Liquidity/Loader'
import { PositionInfo } from 'components/Liquidity/types'
import { LpIncentivesAprDisplay } from 'components/LpIncentives/LpIncentivesAprDisplay'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Circle, Flex, Text, useMedia } from 'ui/src'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'

interface LiquidityPositionInfoProps {
  positionInfo: PositionInfo
  currencyLogoSize?: number
  hideStatusIndicator?: boolean
  showMigrateButton?: boolean
  isMiniVersion?: boolean
  linkToPool?: boolean
  includeLpIncentives?: boolean
  includeNetwork?: boolean
  lpIncentiveRewardApr?: number
}

export function LiquidityPositionInfoLoader({ hideStatus }: { hideStatus?: boolean }) {
  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }}>
      <Circle size={44} backgroundColor="$surface3" />
      <Flex grow $md={{ row: true, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Flex my={hideStatus ? 'auto' : '$none'}>
          <TextLoader variant="subheading1" width={100} />
        </Flex>
        {!hideStatus && <LiquidityPositionStatusIndicatorLoader />}
      </Flex>
    </Flex>
  )
}

export function LiquidityPositionInfo({
  positionInfo,
  currencyLogoSize = 44,
  hideStatusIndicator = false,
  showMigrateButton = false,
  isMiniVersion = false,
  linkToPool = false,
  includeLpIncentives = false,
  includeNetwork = false,
}: LiquidityPositionInfoProps) {
  const { currency0Amount, currency1Amount, status, feeTier, v4hook, version, chainId } = positionInfo
  const navigate = useNavigate()
  const chainInfo = getChainInfo(positionInfo.chainId)
  const media = useMedia()
  const { t } = useTranslation()
  const { formatPercent: _ } = useLocalizationContext()
  const lpIncentiveRewardApr =
    positionInfo.version === ProtocolVersion.V4 && Boolean(positionInfo.boostedApr)
      ? positionInfo.boostedApr
      : undefined

  const isMigrateToV4ButtonVisible = useMemo(() => {
    if (!(positionInfo.version === ProtocolVersion.V3 && showMigrateButton)) {
      return false
    }

    if (isV4UnsupportedChain(positionInfo.chainId)) {
      return false
    }
    // if we're in the md-lg or xl-xxl ranges, hide the button due to overlapping issues
    const isInMdToLgRange = media.lg && !media.md
    const isInXlToXxlRange = media.xxl && !media.xl
    const shouldHideInRange = isInMdToLgRange || isInXlToXxlRange

    return !shouldHideInRange
  }, [positionInfo.version, showMigrateButton, media.lg, media.md, media.xxl, media.xl, positionInfo.chainId])

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(currency0Amount.currency),
    currencyId(currency1Amount.currency),
  ])

  const includeNetworkInLogo = useMemo(() => !includeNetwork || media.lg, [includeNetwork, media.lg])

  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }} alignItems={isMiniVersion ? 'center' : 'flex-start'}>
      <SplitLogo
        inputCurrencyInfo={currency0Info}
        outputCurrencyInfo={currency1Info}
        size={currencyLogoSize}
        chainId={includeNetworkInLogo ? chainId : null}
      />
      <Flex gap={isMiniVersion ? '$none' : '$spacing2'}>
        <Flex
          flexDirection={isMiniVersion ? 'column' : 'row'}
          gap={isMiniVersion ? '$none' : '$gap12'}
          $md={{ gap: isMiniVersion ? '$none' : '$gap12' }}
          alignItems={isMiniVersion ? 'flex-start' : 'center'}
        >
          <Flex>
            {linkToPool ? (
              <Anchor href={getPoolDetailsURL(positionInfo.poolId, positionInfo.chainId)} textDecorationLine="none">
                <Text variant="subheading1" {...ClickableTamaguiStyle}>
                  {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol}
                </Text>
              </Anchor>
            ) : (
              <Text variant="subheading1">
                {currency0Amount.currency.symbol} / {currency1Amount.currency.symbol}
              </Text>
            )}
          </Flex>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges
              size="small"
              version={version}
              v4hook={v4hook}
              feeTier={feeTier}
              cta={
                isMigrateToV4ButtonVisible
                  ? {
                      label: t('pool.migrateToV4'),
                      iconAfter: <RightArrow />,
                      onPress: () => navigate(`/migrate/v3/${chainInfo.urlParam}/${positionInfo.tokenId}`),
                    }
                  : undefined
              }
            />
          </Flex>
        </Flex>

        {!isMiniVersion && (
          <Flex row gap="$gap12">
            {includeNetwork && (
              <Flex row gap="$spacing6" alignItems="center" $lg={{ display: 'none' }}>
                <NetworkLogo chainId={chainInfo.id} size={16} shape="square" />
                <Text variant="body3" color="$neutral2">
                  {chainInfo.name}
                </Text>
              </Flex>
            )}
            {!hideStatusIndicator && (
              <Flex row gap="$spacing6" alignItems="center">
                <LiquidityPositionStatusIndicator status={status} />
              </Flex>
            )}
            {includeLpIncentives && lpIncentiveRewardApr && (
              <LpIncentivesAprDisplay
                lpIncentiveRewardApr={lpIncentiveRewardApr}
                hideBackground
                tooltipProps={{
                  currency0Info,
                  currency1Info,
                  poolApr: positionInfo.apr,
                  totalApr: positionInfo.version === ProtocolVersion.V4 ? positionInfo.totalApr : undefined,
                }}
              />
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
