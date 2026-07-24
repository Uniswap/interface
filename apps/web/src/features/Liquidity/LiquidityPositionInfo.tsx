import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Anchor, Circle, Flex, Text, useMedia } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityPositionStatusIndicator } from 'uniswap/src/features/positions/components/LiquidityPositionStatusIndicator'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { TextLoader } from '~/features/Liquidity/Loader'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { isV4UnsupportedChain } from '~/utils/networkSupportsV4'

function LiquidityPositionStatusIndicatorLoader() {
  return (
    <Flex row gap="$spacing6" alignItems="center">
      <StatusIndicatorCircle color="$surface3" />
      <TextLoader variant="body3" width={100} />
    </Flex>
  )
}

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

  const migrateButtonConfig = useMemo(() => {
    if (!showMigrateButton) {
      return undefined
    }

    if (positionInfo.version === ProtocolVersion.V3 && !isV4UnsupportedChain(positionInfo.chainId)) {
      return {
        fullLabel: t('pool.migrateToV4'),
        shortLabel: t('common.migrate'),
        path: `/migrate/v3/${chainInfo.urlParam}/${positionInfo.tokenId}`,
      }
    }

    if (positionInfo.version === ProtocolVersion.V2 && positionInfo.status !== PositionStatus.CLOSED) {
      return {
        fullLabel: t('pool.migrateToV3'),
        shortLabel: t('common.migrate'),
        path: `/migrate/v2/${chainInfo.urlParam}/${positionInfo.liquidityToken.address}`,
      }
    }

    return undefined
  }, [positionInfo, showMigrateButton, chainInfo.urlParam, t])

  const [currency0Info, currency1Info] = useCurrencyInfos([
    currencyId(currency0Amount.currency),
    currencyId(currency1Amount.currency),
  ])

  const includeNetworkInLogo = useMemo(() => !includeNetwork || media.lg, [includeNetwork, media.lg])

  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }} alignItems={isMiniVersion ? 'center' : 'flex-start'} minWidth={0}>
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
          <Flex row gap={2} alignItems="center" flexWrap="wrap">
            <LiquidityPositionInfoBadges
              size="small"
              version={version}
              v4hook={v4hook}
              chainId={chainId}
              feeTier={feeTier}
              protocolFeePips={positionInfo.protocolFee}
              cta={
                migrateButtonConfig
                  ? {
                      label: media.lg ? migrateButtonConfig.shortLabel : migrateButtonConfig.fullLabel,
                      iconAfter: <ArrowRight color="current" />,
                      onPress: () => navigate(migrateButtonConfig.path),
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
