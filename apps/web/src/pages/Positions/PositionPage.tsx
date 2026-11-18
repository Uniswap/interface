/* oxlint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { areAddressesEqual, EVMUniverseChainId, isEVMChain } from '@universe/chains'
import { isMobileWeb } from '@universe/environment'
import { Button, Flex, Text, TouchableArea } from '@universe/mycelium'
import { FlexCompat, type FlexCompatProps } from '@universe/mycelium/flex-compat'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { ArrowLeft } from '@universe/mycelium/icons/ArrowLeft'
import { ExchangeHorizontal } from '@universe/mycelium/icons/ExchangeHorizontal'
import { Flag } from '@universe/mycelium/icons/Flag'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { SegmentedControl, type SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { useDeviceDimensions, BREAKPOINT_PX } from '@universe/mycelium/theme-hooks-compat'
import { forwardRef, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { PollingInterval, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getPoolName } from 'uniswap/src/features/pools/names'
import { orderPoolDataByQuoteToken } from 'uniswap/src/features/pools/quoteToken'
import { formatPositionPrice } from 'uniswap/src/features/positions/formatPositionPrice'
import { useEffectivePositionStatus } from 'uniswap/src/features/positions/hooks/useEffectivePositionStatus'
import { useGetPositionInfo } from 'uniswap/src/features/positions/hooks/useGetPositionInfo'
import { useGetRangeDisplay } from 'uniswap/src/features/positions/hooks/useGetRangeDisplay'
import type { PositionRewardApr } from 'uniswap/src/features/positions/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { LoadingFullscreen, LoadingRows } from '~/components/Loader/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useAccount } from '~/connection/hooks/useAccount'
import { BaseQuoteFiatAmount } from '~/features/Liquidity/BaseQuoteFiatAmount'
import { WrappedLiquidityPositionRangeChart } from '~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'
import { useReportPositionHandler } from '~/features/Liquidity/hooks/useReportPositionHandler'
import { LiquidityPositionInfo } from '~/features/Liquidity/LiquidityPositionInfo'
import { LoadingRow } from '~/features/Liquidity/Loader'
import { PoolAprTooltip } from '~/features/Liquidity/LPIncentives/PoolAprTooltip'
import { RewardAprBadge } from '~/features/Liquidity/LPIncentives/RewardAprBadge'
import { rewardCurrencyId } from '~/features/Liquidity/LPIncentives/utils'
import { PositionNFT } from '~/features/Liquidity/PositionNFT'
import { PositionPageActionButtons } from '~/features/Liquidity/PositionPageActionButtons'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { NotFound } from '~/pages/NotFound'
import {
  EarningsSection,
  fiatFeeCurrencyAmount,
  PositionSection,
  SectionContainer,
} from '~/pages/Positions/components/PositionSections'
import { usePositionTokenURI } from '~/pages/Positions/usePositionTokenURI'
import { useDynamicMetatags } from '~/pages/routes/metatags'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from '~/state/transactions/hooks'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

// Pool prices routinely run to 1e-6 and below, so keep enough significant digits to survive `Number()`.
const SPOT_PRICE_SIGNIFICANT_DIGITS = 12

const EMPTY_REWARDS: PositionRewardApr[] = []

// `$lg` stays `$lg`: mycelium's `media-lg` is `(max-width: 768px)`; Tailwind's stock `lg:` is the inversion.
const BodyWrapper = forwardRef<HTMLElement, FlexCompatProps>(function BodyWrapper({ $lg: lg, ...props }, ref) {
  return (
    <FlexCompat
      ref={ref}
      tag="main"
      backgroundColor="$surface1"
      gap="$spacing32"
      width="100%"
      maxWidth={1200}
      zIndex="$default"
      py="$spacing24"
      px="$spacing40"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $lg={{ px: '$padding20', ...lg }}
      $md={{ px: '$none' }}
      {...props}
    />
  )
})

function parseTokenId(tokenId: string | undefined): bigint | undefined {
  if (!tokenId) {
    return undefined
  }
  try {
    return BigInt(tokenId)
  } catch {
    return undefined
  }
}

export function PositionPageWrapper() {
  const chainId = useChainIdFromUrlParam()

  if (chainId && !isEVMChain(chainId)) {
    return <Navigate to="/positions" replace />
  }

  return (
    <MultichainContextProvider initialChainId={chainId}>
      <PositionPage chainId={chainId} />
    </MultichainContextProvider>
  )
}

export default PositionPageWrapper

// oxlint-disable-next-line complexity
function PositionPage({ chainId }: { chainId: EVMUniverseChainId | undefined }) {
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId: string }>()
  const tokenId = parseTokenId(tokenIdFromUrl)
  const chainInfo = chainId ? getChainInfo(chainId) : undefined
  const account = useAccount()
  const supportedAccountChainId = useSupportedChainId(account.chainId)
  const { pathname, search } = useLocation()
  const breadcrumb = useEntryPointBreadcrumb()
  // tokenIds are only unique per position manager; the flag routes the read to the PermissionedPositionManager
  const isPermissionedFromUrl = useMemo(() => new URLSearchParams(search).get('permissioned') === 'true', [search])
  const {
    positionInfo,
    isLoading: positionLoading,
    refetch,
  } = useGetPositionInfo({
    owner: account.address ?? ZERO_ADDRESS,
    protocolVersion: pathname.includes('v3')
      ? ProtocolVersion.V3
      : pathname.includes('v4')
        ? ProtocolVersion.V4
        : ProtocolVersion.UNSPECIFIED,
    tokenId: tokenIdFromUrl,
    chainId: chainId ?? supportedAccountChainId,
    permissioned: isPermissionedFromUrl,
  })
  const metadata = usePositionTokenURI({ tokenId, chainId, version: positionInfo?.version })
  usePendingLPTransactionsChangeListener(refetch)

  const navigate = useNavigate()
  const { t } = useTranslation()

  const metatagProperties = useMemo(() => {
    const poolName = getPoolName({
      symbol0: positionInfo?.currency0Amount.currency.symbol,
      symbol1: positionInfo?.currency1Amount.currency.symbol,
      token0IsQuote: positionInfo?.isToken0Quote,
    })
    if (!poolName || !chainInfo?.urlParam || !tokenIdFromUrl) {
      return { title: 'Position on Uniswap', url: window.location.href }
    }
    const version = pathname.includes('v3') ? 'v3' : 'v4'
    return {
      title: `${poolName} on Uniswap`,
      url: window.location.href,
      image: `${window.location.origin}/api/image/positions/${version}/${chainInfo.urlParam}/${tokenIdFromUrl}`,
    }
  }, [
    positionInfo?.isToken0Quote,
    positionInfo?.currency0Amount.currency.symbol,
    positionInfo?.currency1Amount.currency.symbol,
    pathname,
    chainInfo?.urlParam,
    tokenIdFromUrl,
  ])
  const metatags = useDynamicMetatags(metatagProperties)

  const { currency0Amount, currency1Amount, status, fee0Amount, fee1Amount } = positionInfo ?? {}
  // Prefer the backend's per-token fee USD (priced with the same token prices it used for the
  // total `uncollectedFeesUsd`) so the fee breakdown here matches the positions-list total. Only
  // the liquidity-service path serves these; fall back to live pricing on the data-api path.
  // Re-pricing with a live oracle is what made this page disagree with the list (LP-1616).
  const liveFiatFeeValue0 = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const liveFiatFeeValue1 = useUSDCValue(fee1Amount, PollingInterval.Slow)
  const backendFiatFeeValue0 = fiatFeeCurrencyAmount(positionInfo?.token0UncollectedFeesUsd)
  const backendFiatFeeValue1 = fiatFeeCurrencyAmount(positionInfo?.token1UncollectedFeesUsd)
  // All-or-nothing so fee0 and fee1 never mix currencies (backend USD vs the live oracle's
  // per-chain stablecoin), which would break the .add() and share-percentage math downstream.
  const useBackendFees = backendFiatFeeValue0 !== undefined && backendFiatFeeValue1 !== undefined
  const fiatFeeValue0 = useBackendFees ? backendFiatFeeValue0 : liveFiatFeeValue0
  const fiatFeeValue1 = useBackendFees ? backendFiatFeeValue1 : liveFiatFeeValue1
  const fiatValue0 = useUSDCValue(currency0Amount, PollingInterval.Slow)
  const fiatValue1 = useUSDCValue(currency1Amount, PollingInterval.Slow)
  const priceOrdering = useMemo(() => {
    if (positionInfo?.version === ProtocolVersion.V2 || !positionInfo?.position) {
      return {}
    }

    const position = positionInfo.position
    const token0 = position.amount0.currency
    const token1 = position.amount1.currency

    return {
      priceLower: position.token0PriceLower,
      priceUpper: position.token0PriceUpper,
      quote: token1,
      base: token0,
    }
  }, [positionInfo])

  const isPositionVisible = usePositionVisibilityCheck()
  const isVisible =
    positionInfo !== undefined &&
    isPositionVisible({
      poolId: positionInfo.poolId,
      tokenId: positionInfo.tokenId,
      chainId: positionInfo.chainId,
      isFlaggedSpam: positionInfo.isHidden,
    })

  const reportPositionHandler = useReportPositionHandler({
    position: positionInfo,
    isVisible,
    navigateToPositions: true,
  })

  // The backend-served quote token picks the default quote asset (same as the pool details page). The user's
  // flip is stored relative to that default rather than as the absolute value, since positionInfo arrives after mount.
  const defaultInverted = Boolean(positionInfo?.isToken0Quote)
  const [userFlipped, setUserFlipped] = useState(false)
  const togglePriceInverted = useEvent(() => setUserFlipped((flipped) => !flipped))
  const priceInverted = defaultInverted !== userFlipped

  const { formatNumberOrString } = useLocalizationContext()
  const { isPoolPriceStale, isPoolOutOfSync, marketPrice } = useEffectivePositionStatus(positionInfo)
  const stalePriceWarning = useMemo(() => {
    // A stale badge always carries a sibling-pool market price — the status override is gated on
    // one in useEffectivePositionStatus — so the marketPrice check only narrows the type
    if (!isPoolPriceStale || !marketPrice) {
      return undefined
    }

    // Quote the market price in the same orientation as the headline price toggle
    const displayMarketPrice = priceInverted ? marketPrice.invert() : marketPrice
    return {
      marketPrice: `1 ${displayMarketPrice.baseCurrency.symbol} = ${formatNumberOrString({
        value: displayMarketPrice.toSignificant(6),
        type: NumberType.TokenTx,
      })} ${displayMarketPrice.quoteCurrency.symbol}`,
    }
  }, [isPoolPriceStale, marketPrice, priceInverted, formatNumberOrString])

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing: positionInfo?.tickSpacing,
    tickLower: positionInfo?.tickLower,
    tickUpper: positionInfo?.tickUpper,
    pricesInverted: priceInverted,
  })

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(
    { TOKEN0: currency0Amount?.currency, TOKEN1: currency1Amount?.currency },
    priceInverted,
  )

  const [selectedHistoryDuration, setSelectedHistoryDuration] = useState<HistoryDuration>(HistoryDuration.Month)
  const [timePeriodDropdownOpen, setTimePeriodDropdownOpen] = useState(false)
  const [mainViewDropdownOpen, setMainViewDropdownOpen] = useState(false)
  const timePeriodOptions = useMemo(() => {
    const options: Array<SegmentedControlOption<HistoryDuration> & { verboseDisplay: JSX.Element }> = [
      [
        HistoryDuration.Day,
        t('token.priceExplorer.timeRangeLabel.day'),
        t('token.priceExplorer.timeRangeLabel.day.verbose'),
      ],
      [
        HistoryDuration.Week,
        t('token.priceExplorer.timeRangeLabel.week'),
        t('token.priceExplorer.timeRangeLabel.week.verbose'),
      ],
      [
        HistoryDuration.Month,
        t('token.priceExplorer.timeRangeLabel.month'),
        t('token.priceExplorer.timeRangeLabel.month.verbose'),
      ],
      [
        HistoryDuration.Year,
        t('token.priceExplorer.timeRangeLabel.year'),
        t('token.priceExplorer.timeRangeLabel.year.verbose'),
      ],
      [HistoryDuration.Max, t('token.priceExplorer.timeRangeLabel.all')],
    ].map((timePeriod) => ({
      value: timePeriod[0] as HistoryDuration,
      display: <Text variant="buttonLabel3">{timePeriod[1]}</Text>,
      verboseDisplay: <Text variant="buttonLabel3">{timePeriod[2] ?? timePeriod[1]}</Text>,
    }))
    return {
      options,
      selected: selectedHistoryDuration,
    }
  }, [selectedHistoryDuration, t])

  const [mainView, setMainView] = useState<'chart' | 'nft'>('chart')
  const mainViewOptions = useMemo(() => {
    return [
      {
        value: 'chart',
        display: <Text variant="buttonLabel3">{t('common.chart')}</Text>,
      },
      {
        value: 'nft',
        display: <Text variant="buttonLabel3">{t('common.nft')}</Text>,
      },
    ] as const
  }, [t])

  const { fullWidth: screenWidth } = useDeviceDimensions()
  const chartWidth = useMemo(() => {
    // The chart requires an exact numeric width to render correctly.
    // On mobile, we use the full width of the screen minus the padding.
    if (screenWidth && screenWidth < BREAKPOINT_PX.lg) {
      return screenWidth - 64
    }
    // On desktop, we use a max width of 620px and shrink the width as the screen gets smaller.
    if (screenWidth && screenWidth < BREAKPOINT_PX.xxl) {
      return Math.min((screenWidth - 32) / 2, 620)
    }
    return 620
  }, [screenWidth])

  const onMigrate = useEvent(() => {
    navigate(`/migrate/v3/${chainInfo?.urlParam}/${tokenIdFromUrl}`)
  })

  if (positionLoading) {
    return (
      <BodyWrapper>
        <LoadingRows>
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
          <LoadingRow />
        </LoadingRows>
      </BodyWrapper>
    )
  }

  if (!positionInfo || !currency0Amount || !currency1Amount || !baseCurrency || !quoteCurrency) {
    return (
      <NotFound
        title={<Text variant="heading2">{t('position.notFound')}</Text>}
        subtitle={
          <Flex centered maxWidth="75%" mt="$spacing20">
            <Text color="$neutral2" variant="heading3" textAlign="center">
              {t('position.notFound.description')}
            </Text>
          </Flex>
        }
        actionButton={
          <Flex row centered>
            <Button width="fit-content" variant="branded" onPress={() => navigate(breadcrumb.to)}>
              {breadcrumb.label}
            </Button>
          </Flex>
        }
      />
    )
  }

  // While the pool is out of sync, substitute the most liquid sibling pool's price when one exists
  // (marketPrice); without a trustworthy substitute, keep the pool's own price and only warn
  const token0Price =
    positionInfo.version !== ProtocolVersion.V2 ? (marketPrice ?? positionInfo.poolOrPair?.token0Price) : undefined
  const token1Price =
    positionInfo.version !== ProtocolVersion.V2
      ? (marketPrice?.invert() ?? positionInfo.poolOrPair?.token1Price)
      : undefined

  // Live spot price from the pool's active tick, oriented to match the chart's `priceInverted` display.
  const currentSpotPrice = priceInverted ? token1Price : token0Price
  const currentChartPrice = currentSpotPrice
    ? Number(currentSpotPrice.toSignificant(SPOT_PRICE_SIGNIFICANT_DIGITS))
    : undefined

  const isOwner = areAddressesEqual({
    addressInput1: { address: positionInfo.owner, chainId: positionInfo.chainId },
    addressInput2: { address: account.address, chainId: supportedAccountChainId ?? positionInfo.chainId },
  })

  const rewards = positionInfo.rewards ?? EMPTY_REWARDS
  // The pair name keeps the canonical order; only the price display follows the user's flip.
  const [pairBaseCurrency, pairQuoteCurrency] = orderPoolDataByQuoteToken({
    token0IsQuote: positionInfo.isToken0Quote,
    data0: currency0Amount.currency,
    data1: currency1Amount.currency,
  })

  return (
    <Trace
      logImpression
      page={InterfacePageName.PositionDetails}
      properties={{
        pool_address: positionInfo.poolId,
        label: getPoolName({ symbol0: currency0Amount.currency.symbol, symbol1: currency1Amount.currency.symbol }),
        type: positionInfo.version,
        fee_tier: positionInfo.feeTier?.feeAmount,
        baseCurrencyId: currencyIdToAddress(currencyId(currency0Amount.currency)),
        quoteCurrencyId: currencyIdToAddress(currencyId(currency1Amount.currency)),
      }}
    >
      <Helmet>
        <title>
          {t(`liquidityPool.positions.page.title`, {
            quoteSymbol: pairQuoteCurrency.symbol ?? t('common.token'),
            baseSymbol: pairBaseCurrency.symbol ?? t('common.token'),
          })}
        </title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
      </Helmet>
      <BodyWrapper mb={100}>
        <Flex gap="$gap20">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink style={{ gap: '8px' }} to={breadcrumb.to}>
              <ArrowLeft size="$icon.16" /> {breadcrumb.label}
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
          <Flex
            row
            // The actions collapse into a compact '…' below $lg, so the header keeps its single-row
            // layout (position info left, actions right) like the pool detail page.
            $lg={{ alignItems: 'flex-start', gap: '$gap16' }}
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderColor="$surface3"
            pb="$padding16"
          >
            <Flex flex={1} minWidth={0}>
              <LiquidityPositionInfo
                positionInfo={positionInfo}
                linkToPool
                includeNetwork
                stackedLogo
                stalePriceWarning={stalePriceWarning}
              />
            </Flex>
            <PositionPageActionButtons isOwner={isOwner} positionInfo={positionInfo} onMigrate={onMigrate} />
          </Flex>
        </Flex>
        <Flex row justifyContent="space-between" pt="$padding20" $lg={{ row: false, gap: '$gap24' }}>
          <Flex gap="$gap12" width={chartWidth}>
            <Flex row gap="$gap8" alignItems="center">
              <BaseQuoteFiatAmount
                price={priceInverted ? token1Price : token0Price}
                base={priceInverted ? currency1Amount.currency : currency0Amount.currency}
                quote={priceInverted ? currency0Amount.currency : currency1Amount.currency}
                variant="heading3"
              />
              {isPoolOutOfSync && (
                <MouseoverTooltip
                  text={
                    marketPrice
                      ? t('position.currentPrice.poolOutOfSync.tooltip')
                      : t('position.currentPrice.poolOutOfSync.tooltip.noMarketPrice')
                  }
                  placement="top"
                >
                  <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
                </MouseoverTooltip>
              )}
              <TouchableArea onPress={togglePriceInverted}>
                <ExchangeHorizontal size="$icon.16" />
              </TouchableArea>
            </Flex>
            <Flex
              height="auto"
              width="100%"
              $lg={{ width: '100%' }}
              borderWidth={0}
              borderColor="$surface3"
              pb="$padding12"
            >
              {mainView === 'chart' ? (
                <WrappedLiquidityPositionRangeChart
                  version={positionInfo.version}
                  quoteCurrency={quoteCurrency}
                  baseCurrency={baseCurrency}
                  sdkCurrencies={{ TOKEN0: currency0Amount.currency, TOKEN1: currency1Amount.currency }}
                  priceInverted={priceInverted}
                  poolAddressOrId={positionInfo.poolId}
                  chainId={positionInfo.chainId}
                  tickSpacing={positionInfo.tickSpacing}
                  feeTier={positionInfo.feeTier?.feeAmount}
                  hook={positionInfo.v4hook}
                  positionStatus={status}
                  priceOrdering={
                    priceInverted
                      ? {
                          base: priceOrdering.quote,
                          priceLower: priceOrdering.priceUpper?.invert(),
                          priceUpper: priceOrdering.priceLower?.invert(),
                        }
                      : priceOrdering
                  }
                  duration={selectedHistoryDuration}
                  width={chartWidth}
                  height={440}
                  showXAxis
                  showYAxis
                  showLiquidityBars
                  showChartBorder
                  crosshairEnabled={false}
                  currentPrice={currentChartPrice}
                />
              ) : (
                <Flex
                  width="100%"
                  height="100%"
                  justifyContent="center"
                  alignItems="center"
                  py="$spacing20"
                  backgroundColor="$surface2"
                  borderRadius="$rounded20"
                >
                  {'result' in metadata ? (
                    <PositionNFT image={metadata.result.image} height={400} />
                  ) : (
                    <LoadingFullscreen style={{ borderRadius: 12, backgroundColor: 'transparent' }} />
                  )}
                </Flex>
              )}
            </Flex>
            <Flex row alignItems="center" justifyContent="space-between" flexDirection="row-reverse" width="100%">
              {isMobileWeb ? (
                <Dropdown
                  containerStyle={{ width: 'auto' }}
                  menuLabel={
                    <Flex
                      borderRadius="$rounded16"
                      backgroundColor="transparent"
                      row
                      centered
                      p="$padding8"
                      pl="$padding12"
                      borderColor="$surface3"
                      borderWidth="$spacing1"
                      gap="$spacing6"
                      {...ClickableTamaguiStyle}
                    >
                      {mainViewOptions.find((p) => p.value === mainView)?.display}
                      <RotatableChevron direction="down" size="$icon.16" color="$neutral2" />
                    </Flex>
                  }
                  buttonStyle={{
                    borderWidth: 0,
                    p: 0,
                  }}
                  dropdownStyle={{
                    width: 160,
                  }}
                  hideChevron
                  isOpen={mainViewDropdownOpen}
                  toggleOpen={() => {
                    setMainViewDropdownOpen((prev) => !prev)
                  }}
                >
                  {mainViewOptions.map((p) => (
                    <Flex
                      key={p.value}
                      width="100%"
                      height={32}
                      row
                      alignItems="center"
                      justifyContent="flex-start"
                      p="$padding12"
                      onPress={() => {
                        setMainView(p.value)
                      }}
                    >
                      {p.display}
                    </Flex>
                  ))}
                </Dropdown>
              ) : (
                <SegmentedControl
                  options={mainViewOptions}
                  selectedOption={mainView}
                  onSelectOption={(option: 'chart' | 'nft') => {
                    setMainView(option)
                  }}
                />
              )}
              {mainView === 'chart' &&
                (isMobileWeb ? (
                  <Dropdown
                    containerStyle={{ width: 'auto' }}
                    menuLabel={
                      <Flex
                        borderRadius="$rounded16"
                        backgroundColor="transparent"
                        row
                        centered
                        p="$padding8"
                        pl="$padding12"
                        borderColor="$surface3"
                        borderWidth="$spacing1"
                        gap="$spacing6"
                        {...ClickableTamaguiStyle}
                      >
                        {timePeriodOptions.options.find((p) => p.value === timePeriodOptions.selected)?.display}
                        <RotatableChevron direction="down" size="$icon.16" color="$neutral2" />
                      </Flex>
                    }
                    buttonStyle={{
                      borderWidth: 0,
                      p: 0,
                    }}
                    dropdownStyle={{
                      width: 160,
                      left: 0,
                    }}
                    hideChevron
                    isOpen={timePeriodDropdownOpen}
                    toggleOpen={() => {
                      setTimePeriodDropdownOpen((prev) => !prev)
                    }}
                  >
                    {timePeriodOptions.options.map((p) => (
                      <Flex
                        key={p.value}
                        width="100%"
                        height={32}
                        row
                        alignItems="center"
                        justifyContent="flex-start"
                        p="$padding12"
                        onPress={() => {
                          setSelectedHistoryDuration(p.value)
                        }}
                      >
                        {p.verboseDisplay}
                      </Flex>
                    ))}
                  </Dropdown>
                ) : (
                  <SegmentedControl
                    options={timePeriodOptions.options}
                    selectedOption={timePeriodOptions.selected}
                    onSelectOption={(option: HistoryDuration) => {
                      setSelectedHistoryDuration(option)
                    }}
                  />
                ))}
            </Flex>
            <Flex mt="$spacing24">
              <PriceRangeSection
                maxPrice={maxPrice}
                minPrice={minPrice}
                tokenASymbol={tokenASymbol}
                tokenBSymbol={tokenBSymbol}
                isFullRange={isFullRange}
                token0CurrentPrice={token0Price}
                token1CurrentPrice={token1Price}
                priceInverted={priceInverted}
                togglePriceInverted={togglePriceInverted}
              />
            </Flex>
          </Flex>
          <Flex gap="$spacing20">
            <PositionSection
              status={positionInfo.status}
              currency0Amount={currency0Amount}
              currency1Amount={currency1Amount}
              fiatValue0={fiatValue0}
              fiatValue1={fiatValue1}
            />
            <EarningsSection
              positionInfo={positionInfo}
              currency0Amount={currency0Amount}
              currency1Amount={currency1Amount}
              fiatFeeValue0={fiatFeeValue0}
              fiatFeeValue1={fiatFeeValue1}
              fee0Amount={fee0Amount}
              fee1Amount={fee1Amount}
            />
            {rewards.length > 0 && (
              <APRSection
                poolApr={positionInfo.apr}
                totalApr={positionInfo.totalApr}
                apr1d={positionInfo.apr1d}
                apr7d={positionInfo.apr7d}
                apr30d={positionInfo.apr30d}
                rewards={rewards}
              />
            )}
            {!positionInfo.isHidden && (
              <Flex row justifyContent="space-between">
                <Text variant="body3" color="$neutral3">
                  {t('reporting.pool.details.title')}
                </Text>
                <TouchableArea row gap="$gap4" alignItems="center" onPress={reportPositionHandler}>
                  <Flag size="$icon.16" color="$statusCritical" />
                  <Text variant="body3" color="$statusCritical">
                    {t('nft.reportSpam')}
                  </Text>
                </TouchableArea>
              </Flex>
            )}
          </Flex>
        </Flex>
      </BodyWrapper>
    </Trace>
  )
}

const APRSection = ({
  poolApr,
  totalApr,
  apr1d,
  apr7d,
  apr30d,
  rewards,
}: {
  poolApr?: number
  totalApr?: number
  apr1d?: number
  apr7d?: number
  apr30d?: number
  /** The pool's live LP-incentive campaigns, one entry per reward token. */
  rewards: PositionRewardApr[]
}) => {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const hasTimeframeAprs = apr1d !== undefined || apr7d !== undefined || apr30d !== undefined

  // Format APR values
  const displayPoolApr = poolApr ? formatPercent(poolApr) : '-'
  const displayTotalApr = totalApr ? formatPercent(totalApr) : '-'

  return (
    <SectionContainer>
      <Flex justifyContent="space-between" gap="$gap8">
        <Text color="$neutral2" variant="body2">
          {t('pool.totalAPR')}
        </Text>
        <Text color="$neutral1" variant="heading2" pb="$spacing4">
          {displayTotalApr}
        </Text>
        <Flex row justifyContent="space-between">
          <MouseoverTooltip
            disabled={!hasTimeframeAprs}
            padding={0}
            text={
              <PoolAprTooltip
                currency0Info={undefined}
                currency1Info={undefined}
                apr1d={apr1d}
                apr7d={apr7d}
                apr30d={apr30d}
              />
            }
            size={TooltipSize.Small}
            placement="top"
          >
            <Flex row gap="$gap4" alignItems="center">
              <Text color="$neutral2" variant="body3">
                {t('pool.apr.24h')}
              </Text>
              {hasTimeframeAprs && <InfoCircleFilled color="$neutral2" size="$icon.12" />}
            </Flex>
          </MouseoverTooltip>
          <Text color="$neutral1" variant="body3">
            {displayPoolApr}
          </Text>
        </Flex>
        {/* One row per reward token: the boost is per-denomination, and the count follows the
            pool's campaigns rather than anything about the position. */}
        {rewards.map((reward) => (
          <Flex key={rewardCurrencyId(reward.token)} row justifyContent="space-between" gap="$gap8">
            <Text color="$neutral2" variant="body3">
              {t('pool.apr.reward')}
            </Text>
            <RewardAprBadge rewards={[reward]} hideBackground label="symbol" flexShrink={0} />
          </Flex>
        ))}
      </Flex>
    </SectionContainer>
  )
}

const PriceDisplay = ({
  labelText,
  price,
  tokenASymbol,
  tokenBSymbol,
  togglePriceInverted,
}: {
  labelText: string
  price: string
  tokenASymbol?: string
  tokenBSymbol?: string
  togglePriceInverted: () => void
}) => {
  return (
    <Flex
      gap="$gap4"
      flex={1}
      maxWidth="60%"
      minWidth={0}
      overflow="hidden"
      $sm={{ maxWidth: '100%', flexBasis: 'auto' }}
    >
      <Text variant="subheading2" color="$neutral2" numberOfLines={1}>
        {labelText}
      </Text>
      <Text variant="subheading1" ellipsizeMode="middle" numberOfLines={1} title={price}>
        {price}
      </Text>
      <Flex group row alignItems="center" gap="$gap8">
        <Text variant="body4" color="$neutral2" numberOfLines={1}>
          {tokenASymbol} = 1 {tokenBSymbol}
        </Text>
        <TouchableArea animation={null} $group-hover={{ opacity: 1 }} opacity={0} onPress={togglePriceInverted}>
          <ExchangeHorizontal color="$neutral2" size="$icon.16" />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

const PriceRangeSection = ({
  maxPrice,
  minPrice,
  tokenASymbol,
  tokenBSymbol,
  token0CurrentPrice,
  token1CurrentPrice,
  isFullRange,
  priceInverted,
  togglePriceInverted,
}: {
  maxPrice: string
  minPrice: string
  tokenASymbol?: string
  tokenBSymbol?: string
  isFullRange?: boolean
  token0CurrentPrice?: Price<Currency, Currency>
  token1CurrentPrice?: Price<Currency, Currency>
  priceInverted?: boolean
  togglePriceInverted: () => void
}) => {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()
  const formattedMarketPrice = useMemo(() => {
    return formatPositionPrice({
      value: (priceInverted ? token1CurrentPrice : token0CurrentPrice)?.toSignificant(),
      locale,
      formatNumberOrString,
    })
  }, [priceInverted, token0CurrentPrice, token1CurrentPrice, locale, formatNumberOrString])

  if (isFullRange) {
    return null
  }

  return (
    <Flex gap="$spacing24">
      <Text variant="heading3" color="$neutral1">
        Price Range
      </Text>
      <Flex row justifyContent="space-between" gap="$gap16" $sm={{ row: false, gap: '$gap20' }}>
        <PriceDisplay
          labelText={t('pool.minPrice')}
          price={minPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          togglePriceInverted={togglePriceInverted}
        />

        <PriceDisplay
          labelText={t('pool.maxPrice')}
          price={maxPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          togglePriceInverted={togglePriceInverted}
        />

        <PriceDisplay
          labelText={t('common.marketPrice')}
          price={formattedMarketPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          togglePriceInverted={togglePriceInverted}
        />
      </Flex>
    </Flex>
  )
}
