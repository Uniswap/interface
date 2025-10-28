import { BigNumber } from '@ethersproject/bignumber'
import { Position, PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { WrappedLiquidityPositionRangeChart } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { Dropdown } from 'components/Dropdowns/Dropdown'
import { BaseQuoteFiatAmount } from 'components/Liquidity/BaseQuoteFiatAmount'
import { useGetRangeDisplay } from 'components/Liquidity/hooks/useGetRangeDisplay'
import { LiquidityPositionAmountRows } from 'components/Liquidity/LiquidityPositionAmountRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { LiquidityPositionStackedBars } from 'components/Liquidity/LiquidityPositionStackedBars'
import { LoadingRow } from 'components/Liquidity/Loader'
import { PositionNFT } from 'components/Liquidity/PositionNFT'
import { PositionPageActionButtons } from 'components/Liquidity/PositionPageActionButtons'
import type { PositionInfo } from 'components/Liquidity/types'
import { getBaseAndQuoteCurrencies } from 'components/Liquidity/utils/currency'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { LoadingFullscreen, LoadingRows } from 'components/Loader/styled'
import { LP_INCENTIVES_REWARD_TOKEN } from 'components/LpIncentives/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useSrcColor } from 'hooks/useColor'
import { useLpIncentivesFormattedEarnings } from 'hooks/useLpIncentivesFormattedEarnings'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import NotFound from 'pages/NotFound'
import { useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import {
  Button,
  Flex,
  Main,
  SegmentedControl,
  SegmentedControlOption,
  styled,
  Text,
  TouchableArea,
  useSporeColors,
} from 'ui/src'
import { ExchangeHorizontal } from 'ui/src/components/icons/ExchangeHorizontal'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme/breakpoints'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { PollingInterval, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId, currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useChainIdFromUrlParam } from 'utils/chainParams'

const BodyWrapper = styled(Main, {
  backgroundColor: '$surface1',
  display: 'flex',
  flexDirection: 'column',
  gap: '$spacing32',
  width: '100%',
  maxWidth: 1200,
  zIndex: '$default',
  py: '$spacing24',
  px: '$spacing40',

  $lg: {
    px: '$padding20',
  },
})

function parseTokenId(tokenId: string | undefined): BigNumber | undefined {
  if (!tokenId) {
    return undefined
  }
  try {
    return BigNumber.from(tokenId)
  } catch {
    return undefined
  }
}

export default function PositionPageWrapper() {
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

function PositionPage({ chainId }: { chainId: EVMUniverseChainId | undefined }) {
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId: string }>()
  const tokenId = parseTokenId(tokenIdFromUrl)
  const chainInfo = chainId ? getChainInfo(chainId) : undefined
  const account = useAccount()
  const supportedAccountChainId = useSupportedChainId(account.chainId)
  const { pathname } = useLocation()
  const {
    data,
    isLoading: positionLoading,
    refetch,
  } = useGetPositionQuery({
    owner: account.address ?? ZERO_ADDRESS,
    protocolVersion: pathname.includes('v3')
      ? ProtocolVersion.V3
      : pathname.includes('v4')
        ? ProtocolVersion.V4
        : ProtocolVersion.UNSPECIFIED,
    tokenId: tokenIdFromUrl,
    chainId: chainId ?? supportedAccountChainId,
  })
  const position = data?.position
  const positionInfo = useMemo(() => parseRestPosition(position), [position])
  const metadata = usePositionTokenURI({ tokenId, chainId, version: positionInfo?.version })
  usePendingLPTransactionsChangeListener(refetch)

  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const navigate = useNavigate()
  const { t } = useTranslation()

  const { currency0Amount, currency1Amount, status, fee0Amount, fee1Amount } = positionInfo ?? {}
  const fiatFeeValue0 = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const fiatFeeValue1 = useUSDCValue(fee1Amount, PollingInterval.Slow)
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

  const [priceInverted, setPriceInverted] = useState(false)

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

  const [selectedHistoryDuration, setSelectedHistoryDuration] = useState<GraphQLApi.HistoryDuration>(
    GraphQLApi.HistoryDuration.Month,
  )
  const [timePeriodDropdownOpen, setTimePeriodDropdownOpen] = useState(false)
  const [mainViewDropdownOpen, setMainViewDropdownOpen] = useState(false)
  const timePeriodOptions = useMemo(() => {
    const options: Array<SegmentedControlOption<GraphQLApi.HistoryDuration> & { verboseDisplay: JSX.Element }> = [
      [
        GraphQLApi.HistoryDuration.Day,
        t('token.priceExplorer.timeRangeLabel.day'),
        t('token.priceExplorer.timeRangeLabel.day.verbose'),
      ],
      [
        GraphQLApi.HistoryDuration.Week,
        t('token.priceExplorer.timeRangeLabel.week'),
        t('token.priceExplorer.timeRangeLabel.week.verbose'),
      ],
      [
        GraphQLApi.HistoryDuration.Month,
        t('token.priceExplorer.timeRangeLabel.month'),
        t('token.priceExplorer.timeRangeLabel.month.verbose'),
      ],
      [
        GraphQLApi.HistoryDuration.Year,
        t('token.priceExplorer.timeRangeLabel.year'),
        t('token.priceExplorer.timeRangeLabel.year.verbose'),
      ],
      [GraphQLApi.HistoryDuration.Max, t('token.priceExplorer.timeRangeLabel.all')],
    ].map((timePeriod) => ({
      value: timePeriod[0] as GraphQLApi.HistoryDuration,
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
    if (screenWidth && screenWidth < breakpoints.lg) {
      return screenWidth - 64
    }
    // On desktop, we use a max width of 620px and shrink the width as the screen gets smaller.
    if (screenWidth && screenWidth < breakpoints.xxl) {
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

  if (!position || !positionInfo || !currency0Amount || !currency1Amount || !baseCurrency || !quoteCurrency) {
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
            <Button width="fit-content" variant="branded" onPress={() => navigate('/positions')}>
              {t('common.backToPositions')}
            </Button>
          </Flex>
        }
      />
    )
  }

  const token0Price = positionInfo.version !== ProtocolVersion.V2 ? positionInfo.poolOrPair?.token0Price : undefined
  const token1Price = positionInfo.version !== ProtocolVersion.V2 ? positionInfo.poolOrPair?.token1Price : undefined

  const isOwner = areAddressesEqual({
    addressInput1: { address: positionInfo.owner, chainId: positionInfo.chainId },
    addressInput2: { address: account.address, chainId: supportedAccountChainId ?? positionInfo.chainId },
  })

  return (
    <Trace
      logImpression
      page={InterfacePageName.PositionDetails}
      properties={{
        pool_address: positionInfo.poolId,
        label: [currency0Amount.currency.symbol, currency1Amount.currency.symbol].join('/'),
        type: positionInfo.version,
        fee_tier: positionInfo.feeTier?.feeAmount,
        baseCurrencyId: currencyIdToAddress(currencyId(currency0Amount.currency)),
        quoteCurrencyId: currencyIdToAddress(currencyId(currency1Amount.currency)),
      }}
    >
      <Helmet>
        <title>
          {t(`liquidityPool.positions.page.title`, {
            quoteSymbol: currency1Amount.currency.symbol,
            baseSymbol: currency0Amount.currency.symbol,
          })}
        </title>
      </Helmet>
      <BodyWrapper mb={100}>
        <Flex gap="$gap20">
          <BreadcrumbNavContainer aria-label="breadcrumb-nav">
            <BreadcrumbNavLink style={{ gap: '8px' }} to="/positions">
              <ArrowLeft size={14} /> <Trans i18nKey="pool.positions.title" />
            </BreadcrumbNavLink>
          </BreadcrumbNavContainer>
          <Flex
            row
            $lg={{ row: false, alignItems: 'flex-start', gap: '$gap16' }}
            justifyContent="space-between"
            alignItems="center"
            borderBottomWidth={1}
            borderColor="$surface3"
            pb="$padding16"
          >
            <LiquidityPositionInfo
              positionInfo={positionInfo}
              linkToPool
              includeNetwork
              includeLpIncentives={isLpIncentivesEnabled}
            />
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
              <TouchableArea
                onPress={() => {
                  setPriceInverted((prev) => !prev)
                }}
              >
                <ExchangeHorizontal size="$icon.16" />
              </TouchableArea>
            </Flex>
            <Flex
              animation="fast"
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
                      gap="$gap6"
                      {...ClickableTamaguiStyle}
                    >
                      {mainViewOptions.find((p) => p.value === mainView)?.display}
                      <RotatableChevron direction="down" height={16} width={16} color="$neutral2" />
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
                        gap="$gap6"
                        {...ClickableTamaguiStyle}
                      >
                        {timePeriodOptions.options.find((p) => p.value === timePeriodOptions.selected)?.display}
                        <RotatableChevron direction="down" height={16} width={16} color="$neutral2" />
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
                    onSelectOption={(option: GraphQLApi.HistoryDuration) => {
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
                setPriceInverted={setPriceInverted}
              />
            </Flex>
          </Flex>
          <Flex gap="$spacing20">
            <PositionSection
              position={position}
              currency0Amount={currency0Amount}
              currency1Amount={currency1Amount}
              fiatValue0={fiatValue0}
              fiatValue1={fiatValue1}
            />
            <EarningsSection
              positionInfo={positionInfo}
              currency0Amount={currency0Amount}
              currency1Amount={currency1Amount}
              fiatValue0={fiatValue0}
              fiatValue1={fiatValue1}
              fiatFeeValue0={fiatFeeValue0}
              fiatFeeValue1={fiatFeeValue1}
              fee0Amount={fee0Amount}
              fee1Amount={fee1Amount}
            />
            {isLpIncentivesEnabled &&
              positionInfo.version === ProtocolVersion.V4 &&
              Boolean(positionInfo.boostedApr) && (
                <APRSection
                  poolApr={positionInfo.apr}
                  lpIncentiveRewardApr={positionInfo.boostedApr}
                  totalApr={positionInfo.totalApr}
                />
              )}
          </Flex>
        </Flex>
      </BodyWrapper>
    </Trace>
  )
}

const SectionContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Flex
      p="$spacing20"
      backgroundColor="$surface2"
      width={380}
      $lg={{ width: '100%' }}
      borderRadius="$rounded16"
      gap="$spacing24"
      $platform-web={{
        height: 'min-content',
      }}
    >
      {children}
    </Flex>
  )
}

const PositionSection = ({
  position,
  currency0Amount,
  currency1Amount,
  fiatValue0,
  fiatValue1,
}: {
  position: Position
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  fiatValue0: Maybe<CurrencyAmount<Currency>>
  fiatValue1: Maybe<CurrencyAmount<Currency>>
}) => {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const currencyInfo0 = useCurrencyInfo(currency0Amount.currency)
  const currencyInfo1 = useCurrencyInfo(currency1Amount.currency)
  const token0Color = useSrcColor({
    src: currencyInfo0?.logoUrl ?? undefined,
    currencyName: currencyInfo0?.currency.name,
    backgroundColor: colors.surface2.val,
  }).tokenColor
  const token1Color = useSrcColor({
    src: currencyInfo1?.logoUrl ?? undefined,
    currencyName: currencyInfo1?.currency.name,
    backgroundColor: colors.surface2.val,
  }).tokenColor
  const totalFiatValue = fiatValue0?.add(fiatValue1 ?? CurrencyAmount.fromRawAmount(fiatValue0.currency, 0))
  const bars = useMemo(() => {
    const percent0 =
      totalFiatValue?.greaterThan(0) && fiatValue0
        ? new Percent(fiatValue0.quotient, totalFiatValue.quotient)
        : undefined

    const percent1 =
      totalFiatValue?.greaterThan(0) && fiatValue1
        ? new Percent(fiatValue1.quotient, totalFiatValue.quotient)
        : undefined

    if (!percent0 || !percent1 || !token0Color || !token1Color || !currencyInfo0 || !currencyInfo1) {
      return []
    }

    return [
      { value: percent0, color: token0Color, currencyInfo: currencyInfo0 },
      { value: percent1, color: token1Color, currencyInfo: currencyInfo1 },
    ]
  }, [currencyInfo0, currencyInfo1, fiatValue0, fiatValue1, token0Color, token1Color, totalFiatValue])

  const rows = useMemo(() => {
    if (!currencyInfo0 || !currencyInfo1) {
      return []
    }

    return [
      {
        currencyInfo: currencyInfo0,
        currencyAmount: currency0Amount,
        fiatValue: fiatValue0,
      },
      {
        currencyInfo: currencyInfo1,
        currencyAmount: currency1Amount,
        fiatValue: fiatValue1,
      },
    ]
  }, [currencyInfo0, currencyInfo1, currency0Amount, currency1Amount, fiatValue0, fiatValue1])

  return (
    <SectionContainer>
      <Flex gap="$gap8">
        <Text color="$neutral2" variant="body2">
          <Trans i18nKey="pool.position" />
        </Text>
        {position.status === PositionStatus.CLOSED ? (
          <Text variant="heading2" $lg={{ variant: 'heading3' }}>
            {convertFiatAmountFormatted(0, NumberType.FiatTokenPrice)}
          </Text>
        ) : (
          <>
            <Text variant="heading2" mb="$spacing12">
              {fiatValue0 && fiatValue1 ? (
                convertFiatAmountFormatted(fiatValue0.add(fiatValue1).toExact(), NumberType.FiatTokenPrice)
              ) : (
                <MouseoverTooltip text={t('pool.positions.usdValueUnavailable.tooltip')} placement="right">
                  <Flex alignItems="center" row gap="$gap8">
                    <Text variant="body1" color="$neutral2">
                      {t('pool.positions.usdValueUnavailable')}
                    </Text>
                    <InfoCircleFilled color="$neutral2" size="$icon.16" />
                  </Flex>
                </MouseoverTooltip>
              )}
            </Text>
            {bars.length > 0 && (
              <Flex mb="$spacing24">
                <LiquidityPositionStackedBars bars={bars} />
              </Flex>
            )}
            {rows.length > 0 && <LiquidityPositionAmountRows rows={rows} />}
          </>
        )}
      </Flex>
    </SectionContainer>
  )
}

const APRSection = ({
  poolApr,
  lpIncentiveRewardApr,
  totalApr,
}: {
  poolApr?: number
  lpIncentiveRewardApr?: number
  totalApr?: number
}) => {
  const { address, chainId, symbol } = LP_INCENTIVES_REWARD_TOKEN
  const currencyInfo = useCurrencyInfo(address, chainId)
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  // Format APR values
  const displayPoolApr = poolApr ? formatPercent(poolApr) : '-'
  const displayRewardApr = lpIncentiveRewardApr ? formatPercent(lpIncentiveRewardApr) : '-'
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
          <Text color="$neutral2" variant="body3">
            {t('pool.aprText')}
          </Text>
          <Text color="$neutral1" variant="body3">
            {displayPoolApr}
          </Text>
        </Flex>
        <Flex row justifyContent="space-between">
          <Text color="$neutral2" variant="body3">
            {t('pool.rewardAPR')}
          </Text>
          <Flex row gap="$spacing6" alignItems="center">
            <CurrencyLogo currencyInfo={currencyInfo} size={16} />
            <Text color="$accent1" variant="body3">
              {displayRewardApr} {symbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </SectionContainer>
  )
}

const EarningsSection = ({
  positionInfo,
  currency0Amount,
  currency1Amount,
  fiatFeeValue0,
  fiatFeeValue1,
  fee0Amount,
  fee1Amount,
}: {
  positionInfo: PositionInfo
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  fiatValue0: Maybe<CurrencyAmount<Currency>>
  fiatValue1: Maybe<CurrencyAmount<Currency>>
  fiatFeeValue0: Maybe<CurrencyAmount<Currency>>
  fiatFeeValue1: Maybe<CurrencyAmount<Currency>>
  fee0Amount?: CurrencyAmount<Currency>
  fee1Amount?: CurrencyAmount<Currency>
}) => {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const { uniLpRewardsCurrencyAmount, uniLpRewardsFiatValue, totalEarningsFiatValue, hasRewards, hasFees } =
    useLpIncentivesFormattedEarnings({
      liquidityPosition: positionInfo,
      fiatFeeValue0,
      fiatFeeValue1,
    })

  // TODO(WEB-4920): skip GraphQL call once backend provides image URLs
  const [currencyInfo0, currencyInfo1, rewardCurrencyInfo] = useCurrencyInfos([
    currencyId(currency0Amount.currency),
    currencyId(currency1Amount.currency),
    buildCurrencyId(UniverseChainId.Mainnet, LP_INCENTIVES_REWARD_TOKEN.address),
  ])

  const token0Color = useSrcColor({
    src: currencyInfo0?.logoUrl ?? undefined,
    currencyName: currencyInfo0?.currency.name,
    backgroundColor: colors.surface2.val,
  }).tokenColor
  const token1Color = useSrcColor({
    src: currencyInfo1?.logoUrl ?? undefined,
    currencyName: currencyInfo1?.currency.name,
    backgroundColor: colors.surface2.val,
  }).tokenColor
  const rewardTokenColor = useSrcColor({
    src: rewardCurrencyInfo?.logoUrl ?? undefined,
    currencyName: rewardCurrencyInfo?.currency.name,
    backgroundColor: colors.surface2.val,
  }).tokenColor

  const bars = useMemo(() => {
    const percent0 =
      totalEarningsFiatValue?.greaterThan(0) && fiatFeeValue0
        ? new Percent(fiatFeeValue0.quotient, totalEarningsFiatValue.quotient)
        : undefined

    const percent1 =
      totalEarningsFiatValue?.greaterThan(0) && fiatFeeValue1
        ? new Percent(fiatFeeValue1.quotient, totalEarningsFiatValue.quotient)
        : undefined

    if (!percent0 || !percent1 || !token0Color || !token1Color || !currencyInfo0 || !currencyInfo1) {
      return []
    }

    const rewards =
      isLpIncentivesEnabled &&
      rewardTokenColor &&
      uniLpRewardsFiatValue?.greaterThan(0) &&
      totalEarningsFiatValue?.greaterThan(0) &&
      hasRewards
        ? [
            {
              value: new Percent(uniLpRewardsFiatValue.quotient, totalEarningsFiatValue.quotient),
              color: rewardTokenColor,
              currencyInfo: rewardCurrencyInfo as CurrencyInfo,
            },
          ]
        : []

    return [
      { value: percent0, color: token0Color, currencyInfo: currencyInfo0 },
      { value: percent1, color: token1Color, currencyInfo: currencyInfo1 },
      ...rewards,
    ]
  }, [
    totalEarningsFiatValue,
    fiatFeeValue0,
    fiatFeeValue1,
    token0Color,
    token1Color,
    currencyInfo0,
    currencyInfo1,
    isLpIncentivesEnabled,
    rewardTokenColor,
    uniLpRewardsFiatValue,
    hasRewards,
    rewardCurrencyInfo,
  ])

  const feeRows = useMemo(() => {
    if (!currencyInfo0 || !currencyInfo1 || !fee0Amount || !fee1Amount) {
      return []
    }

    return [
      {
        currencyInfo: currencyInfo0,
        currencyAmount: fee0Amount,
        fiatValue: fiatFeeValue0,
      },
      {
        currencyInfo: currencyInfo1,
        currencyAmount: fee1Amount,
        fiatValue: fiatFeeValue1,
      },
    ]
  }, [currencyInfo0, currencyInfo1, fee0Amount, fee1Amount, fiatFeeValue0, fiatFeeValue1])

  const rewardRows = useMemo(() => {
    if (!isLpIncentivesEnabled || !rewardCurrencyInfo || !hasRewards) {
      return []
    }

    return [
      {
        currencyInfo: rewardCurrencyInfo,
        currencyAmount: uniLpRewardsCurrencyAmount || CurrencyAmount.fromRawAmount(rewardCurrencyInfo.currency, 0),
        fiatValue: uniLpRewardsFiatValue,
      },
    ]
  }, [isLpIncentivesEnabled, rewardCurrencyInfo, uniLpRewardsCurrencyAmount, uniLpRewardsFiatValue, hasRewards])

  return (
    <SectionContainer>
      <Flex gap="$gap8">
        <Text color="$neutral2" variant="body2">
          {isLpIncentivesEnabled && hasRewards ? t('pool.earnings') : t('common.feesEarned')}
        </Text>
        {positionInfo.status === PositionStatus.CLOSED ? (
          <Text variant="heading2">{convertFiatAmountFormatted(0, NumberType.FiatRewards)}</Text>
        ) : (
          <>
            <Text variant="heading2" mb="$spacing12">
              {totalEarningsFiatValue ? (
                convertFiatAmountFormatted(totalEarningsFiatValue.toExact(), NumberType.FiatRewards)
              ) : (
                <MouseoverTooltip text={t('pool.positions.usdValueUnavailable.tooltip')} placement="right">
                  <Flex alignItems="center" row gap="$gap8">
                    <Text variant="body1" color="$neutral2">
                      {t('pool.positions.usdValueUnavailable')}
                    </Text>
                    <InfoCircleFilled color="$neutral2" size="$icon.16" />
                  </Flex>
                </MouseoverTooltip>
              )}
            </Text>
            {bars.length > 0 && (
              <Flex mb="$spacing24">
                <LiquidityPositionStackedBars bars={bars} />
              </Flex>
            )}

            {isLpIncentivesEnabled ? (
              <>
                {hasRewards && rewardRows.length > 0 && (
                  <>
                    <Text color="$neutral2" variant="body2" mb="$spacing12">
                      {t('pool.rewards')}
                    </Text>
                    <LiquidityPositionAmountRows rows={rewardRows} />
                  </>
                )}
                {hasFees && feeRows.length > 0 && (
                  <>
                    <Text color="$neutral2" variant="body2" mb="$spacing12" mt={hasRewards ? '$spacing24' : '$none'}>
                      {t('common.fees')}
                    </Text>
                    <LiquidityPositionAmountRows rows={feeRows} />
                  </>
                )}
              </>
            ) : (
              feeRows.length > 0 && <LiquidityPositionAmountRows rows={feeRows} />
            )}

            {(!totalEarningsFiatValue || totalEarningsFiatValue.equalTo(0)) && (
              <Text variant="body3" color="$neutral3">
                {t('pool.earnings.empty')}
              </Text>
            )}
          </>
        )}
      </Flex>
    </SectionContainer>
  )
}

const PriceDisplay = ({
  labelText,
  price,
  tokenASymbol,
  tokenBSymbol,
  setPriceInverted,
}: {
  labelText: string
  price: string | React.ReactNode
  tokenASymbol?: string
  tokenBSymbol?: string
  setPriceInverted: (value: React.SetStateAction<boolean>) => void
}) => {
  return (
    <Flex gap="$gap4">
      <Text variant="subheading2" color="$neutral2">
        {labelText}
      </Text>
      <Text variant="subheading1">{price}</Text>
      <Flex group row>
        <Flex row gap="$gap8" alignItems="center">
          <Text variant="body4" color="$neutral2">
            {tokenASymbol} = 1 {tokenBSymbol}
          </Text>
          <TouchableArea
            $group-hover={{ opacity: 1 }}
            opacity={0}
            onPress={() => {
              setPriceInverted((prev: boolean) => !prev)
            }}
          >
            <ExchangeHorizontal color="$neutral2" size="$icon.16" />
          </TouchableArea>
        </Flex>
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
  setPriceInverted,
}: {
  maxPrice: string
  minPrice: string
  tokenASymbol?: string
  tokenBSymbol?: string
  isFullRange?: boolean
  token0CurrentPrice?: Price<Currency, Currency>
  token1CurrentPrice?: Price<Currency, Currency>
  priceInverted?: boolean
  setPriceInverted: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const formattedMarketPrice = useMemo(() => {
    return formatNumberOrString({
      value: (priceInverted ? token1CurrentPrice : token0CurrentPrice)?.toSignificant(),
      type: NumberType.TokenTx,
    })
  }, [priceInverted, token0CurrentPrice, token1CurrentPrice, formatNumberOrString])

  if (isFullRange) {
    return null
  }

  return (
    <Flex gap="$spacing24">
      <Text variant="heading3" color="$neutral1">
        Price Range
      </Text>
      <Flex row justifyContent="space-between">
        <PriceDisplay
          labelText={t('pool.minPrice')}
          price={minPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          setPriceInverted={setPriceInverted}
        />

        <PriceDisplay
          labelText={t('pool.maxPrice')}
          price={maxPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          setPriceInverted={setPriceInverted}
        />

        <PriceDisplay
          labelText={t('common.marketPrice')}
          price={formattedMarketPrice}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          setPriceInverted={setPriceInverted}
        />
      </Flex>
    </Flex>
  )
}
