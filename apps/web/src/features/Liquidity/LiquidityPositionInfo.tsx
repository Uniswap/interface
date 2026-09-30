import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Flex, Text } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { StatusIndicatorCircle } from '@universe/mycelium/icons/StatusIndicatorCircle'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getStackedLogoWidth, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LiquidityPositionStatusIndicator } from 'uniswap/src/features/positions/components/LiquidityPositionStatusIndicator'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { shouldReverseForWaterfall } from 'uniswap/src/features/tokens/waterfallPriority'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { getDetailHeaderLogoSize } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { MouseoverTooltip } from '~/components/Tooltip'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { TextLoader } from '~/features/Liquidity/Loader'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { isV4UnsupportedChain } from '~/utils/networkSupportsV4'

// Subset only: the full style also carries `$platform-web`, whose keys the compat props reject.
const { cursor, hoverStyle, pressStyle } = ClickableTamaguiStyle

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
  includeNetwork?: boolean
  /** Renders the range status in a warning state; the pool price backing the status may be stale. A stale badge always carries the sibling-pool market price backing the corrected status. */
  stalePriceWarning?: { marketPrice: string }
  /** Opt in to the stacked full-logo treatment (position detail header). Ignored in dense/mini contexts. */
  stackedLogo?: boolean
}

// Default per-logo size, shared by the component and its loader so the loading placeholder always
// reserves the same footprint the loaded logo occupies (no load-time shift), even if a caller overrides it.
const DEFAULT_CURRENCY_LOGO_SIZE = 44

export function LiquidityPositionInfoLoader({
  hideStatus,
  stacked = false,
}: {
  hideStatus?: boolean
  // Match the position-detail header's stacked double logo so its footprint is reserved and content doesn't shift on load.
  stacked?: boolean
}) {
  const media = useMedia()
  const logoSize = getDetailHeaderLogoSize({ media, restingSize: DEFAULT_CURRENCY_LOGO_SIZE })
  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }}>
      {stacked ? (
        <Flex
          width={getStackedLogoWidth(logoSize)}
          height={logoSize}
          borderRadius="$roundedFull"
          backgroundColor="$surface3"
        />
      ) : (
        <Flex
          width={DEFAULT_CURRENCY_LOGO_SIZE}
          height={DEFAULT_CURRENCY_LOGO_SIZE}
          alignItems="center"
          justifyContent="center"
          borderRadius="$roundedFull"
          p={0}
          backgroundColor="$surface3"
        />
      )}
      <Flex grow $md={{ row: true, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Flex my={hideStatus ? 'auto' : '$none'}>
          <TextLoader variant="subheading1" width={100} />
        </Flex>
        {!hideStatus && <LiquidityPositionStatusIndicatorLoader />}
      </Flex>
    </Flex>
  )
}

function getStalePriceTooltip({
  status,
  marketPrice,
  t,
}: {
  status: PositionStatus
  marketPrice: string
  t: TFunction
}): string {
  return status === PositionStatus.OUT_OF_RANGE
    ? t('position.status.outOfRange.stalePrice.tooltip', { marketPrice })
    : t('position.status.inRange.stalePrice.tooltip', { marketPrice })
}

function PositionStatusRow({
  positionInfo,
  includeNetwork,
  isMobileDetailHeader,
  hideStatusIndicator,
  stalePriceWarning,
  badges,
}: {
  positionInfo: PositionInfo
  includeNetwork: boolean
  isMobileDetailHeader: boolean
  hideStatusIndicator: boolean
  stalePriceWarning?: { marketPrice: string }
  badges: JSX.Element
}) {
  const { t } = useTranslation()
  const chainInfo = getChainInfo(positionInfo.chainId)

  return (
    <Flex
      row
      gap="$gap12"
      alignItems={isMobileDetailHeader ? 'center' : undefined}
      testID={TestID.PositionInfoStatusRow}
    >
      {includeNetwork && (
        <Flex row gap="$spacing6" alignItems="center" $lg={{ display: 'none' }}>
          <NetworkLogo chainId={chainInfo.id} size={16} shape="square" />
          <Text variant="body3" color="$neutral2">
            {chainInfo.name}
          </Text>
        </Flex>
      )}
      {isMobileDetailHeader && (
        <>
          {badges}
          {/* Same divider treatment as the pool detail header's second row. */}
          {!hideStatusIndicator && <Flex width={1} alignSelf="stretch" backgroundColor="$surface3" />}
        </>
      )}
      {!hideStatusIndicator && (
        <Flex row gap="$spacing6" alignItems="center">
          {/* When disabled the tooltip renders its child in a bare Fragment, so the no-warning DOM is unchanged */}
          <MouseoverTooltip
            disabled={!stalePriceWarning}
            text={
              stalePriceWarning
                ? getStalePriceTooltip({
                    status: positionInfo.status,
                    marketPrice: stalePriceWarning.marketPrice,
                    t,
                  })
                : undefined
            }
            placement="top"
          >
            <LiquidityPositionStatusIndicator
              status={positionInfo.status}
              showStalePriceWarning={stalePriceWarning !== undefined}
            />
          </MouseoverTooltip>
        </Flex>
      )}
    </Flex>
  )
}

export function LiquidityPositionInfo({
  positionInfo,
  currencyLogoSize = DEFAULT_CURRENCY_LOGO_SIZE,
  hideStatusIndicator = false,
  showMigrateButton = false,
  isMiniVersion = false,
  linkToPool = false,
  includeNetwork = false,
  stalePriceWarning,
  stackedLogo = false,
}: LiquidityPositionInfoProps) {
  const { currency0Amount, currency1Amount, feeTier, v4hook, version, chainId } = positionInfo
  const navigate = useNavigate()
  const chainInfo = getChainInfo(positionInfo.chainId)
  const media = useMedia()
  const { t } = useTranslation()
  const { formatPercent: _ } = useLocalizationContext()

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
  // Same base/quote orientation as the positions table row and the pool details header, so the pair
  // reads the same on the list, the detail page, and the flows launched from it.
  const reversed = shouldReverseForWaterfall(currency0Amount.currency, currency1Amount.currency)
  const [baseCurrency, quoteCurrency] = reversed
    ? [currency1Amount.currency, currency0Amount.currency]
    : [currency0Amount.currency, currency1Amount.currency]
  const [baseInfo, quoteInfo] = reversed ? [currency1Info, currency0Info] : [currency0Info, currency1Info]

  const includeNetworkInLogo = useMemo(() => !includeNetwork || media.lg, [includeNetwork, media.lg])
  const isDetailHeader = stackedLogo && !isMiniVersion
  // Mirrors the pool detail header's mobile layout at the same 640 breakpoint: badges leave the title
  // row and join the status indicator on row 2 at the compact size.
  const isMobileDetailHeader = isDetailHeader && media.md

  const badges = (
    <Flex row gap={2} alignItems="center" flexWrap="wrap">
      <LiquidityPositionInfoBadges
        size={isMobileDetailHeader ? 'compact' : 'small'}
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
  )

  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }} alignItems={isMiniVersion ? 'center' : 'flex-start'} minWidth={0}>
      <SplitLogo
        inputCurrencyInfo={baseInfo}
        outputCurrencyInfo={quoteInfo}
        size={isDetailHeader ? getDetailHeaderLogoSize({ media, restingSize: currencyLogoSize }) : currencyLogoSize}
        chainId={includeNetworkInLogo ? chainId : null}
        orientation={isDetailHeader ? 'stacked' : 'split'}
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
              <Text
                tag="a"
                href={getPoolDetailsURL(positionInfo.poolId, positionInfo.chainId)}
                textDecorationLine="none"
              >
                <Text
                  variant="subheading1"
                  cursor={cursor}
                  hoverStyle={hoverStyle}
                  pressStyle={pressStyle}
                  // Legacy `$platform-web.transitionDuration: '0.2s'`; only opacity changes on
                  // hover/press here, and color transitions must stay excluded (theme-toggle flash).
                  transition="opacity 0.2s"
                >
                  {baseCurrency.symbol} / {quoteCurrency.symbol}
                </Text>
              </Text>
            ) : (
              <Text variant="subheading1">
                {baseCurrency.symbol} / {quoteCurrency.symbol}
              </Text>
            )}
          </Flex>
          {!isMobileDetailHeader && badges}
        </Flex>

        {!isMiniVersion && (
          <PositionStatusRow
            positionInfo={positionInfo}
            includeNetwork={includeNetwork}
            isMobileDetailHeader={isMobileDetailHeader}
            hideStatusIndicator={hideStatusIndicator}
            stalePriceWarning={stalePriceWarning}
            badges={badges}
          />
        )}
      </Flex>
    </Flex>
  )
}
