import { BigNumber } from '@ethersproject/bignumber'
/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { LiquidityPositionRangeChart } from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { DropdownSelector } from 'components/DropdownSelector'
import { LiquidityPositionAmountRows } from 'components/Liquidity/LiquidityPositionAmountRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { PositionNFT } from 'components/Liquidity/PositionNFT'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { parseRestPosition } from 'components/Liquidity/utils'
import { LoadingFullscreen, LoadingRows } from 'components/Loader/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePositionTokenURI } from 'hooks/usePositionTokenURI'
import NotFound from 'pages/NotFound'
import { LegacyPositionPage } from 'pages/Pool/Positions/LegacyPositionPage'
import { BaseQuoteFiatAmount } from 'pages/Pool/Positions/create/BaseQuoteFiatAmount'
import { BodyWrapper, LoadingRow } from 'pages/Pool/Positions/shared'
import { useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Button, Flex, SegmentedControl, SegmentedControlOption, Text, TouchableArea, useMedia } from 'ui/src'
import { ExchangeHorizontal } from 'ui/src/components/icons/ExchangeHorizontal'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme/breakpoints'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useGetPositionQuery } from 'uniswap/src/data/rest/getPosition'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal, ModalName } from 'uniswap/src/features/telemetry/constants'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { isMobileWeb } from 'utilities/src/platform'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'
import { useAccount } from 'wagmi'

function parseTokenId(tokenId: string | undefined): BigNumber | undefined {
  if (!tokenId) {
    return undefined
  }
  try {
    return BigNumber.from(tokenId)
  } catch (error) {
    return undefined
  }
}

export default function PositionPageWrapper() {
  const chainId = useChainIdFromUrlParam()

  const isNewPositionPageEnabled = useFeatureFlag(FeatureFlags.PositionPageV2)

  return (
    <MultichainContextProvider initialChainId={chainId}>
      {isNewPositionPageEnabled ? <PositionPage /> : <LegacyPositionPage />}
    </MultichainContextProvider>
  )
}

function PositionPage() {
  const { tokenId: tokenIdFromUrl } = useParams<{ tokenId: string }>()
  const tokenId = parseTokenId(tokenIdFromUrl)
  const chainId = useChainIdFromUrlParam()
  const chainInfo = chainId ? getChainInfo(chainId) : undefined
  const account = useAccount()
  const supportedAccountChainId = useSupportedChainId(account.chainId)
  const { pathname } = useLocation()
  const {
    data,
    isLoading: positionLoading,
    refetch,
  } = useGetPositionQuery({
    owner: account?.address ?? ZERO_ADDRESS,
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
  const metadata = usePositionTokenURI(tokenId, chainInfo?.id, positionInfo?.version)
  usePendingLPTransactionsChangeListener(refetch)

  const dispatch = useAppDispatch()

  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const isMigrateToV4Enabled = useFeatureFlag(FeatureFlags.MigrateV3ToV4)

  const { formatCurrencyAmount } = useFormatter()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const media = useMedia()

  const { currency0Amount, currency1Amount, status } = positionInfo ?? {}
  const {
    feeValue0,
    feeValue1,
    fiatFeeValue0,
    fiatFeeValue1,
    token0CurrentPrice,
    token1CurrentPrice,
    fiatValue0,
    fiatValue1,
    priceOrdering,
  } = useV3OrV4PositionDerivedInfo(positionInfo)

  const [priceInverted, setPriceInverted] = useState(false)
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
        display: <Text variant="buttonLabel4">{t('common.chart')}</Text>,
      },
      {
        value: 'nft',
        display: <Text variant="buttonLabel4">{t('common.nft')}</Text>,
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

  if (!position || !positionInfo || !currency0Amount || !currency1Amount) {
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

  const hasFees = feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) || false
  const isOwner = addressesAreEquivalent(positionInfo.owner, account?.address)

  const showV4UnsupportedTooltip = isV4UnsupportedChain(positionInfo.chainId)

  return (
    <Trace
      logImpression
      page={InterfacePageNameLocal.PositionDetails}
      properties={{
        pool_address: positionInfo.poolId,
        label: [currency0Amount.currency.symbol, currency1Amount.currency.symbol].join('/'),
        type: positionInfo.version,
        fee_tier: typeof positionInfo.feeTier === 'string' ? parseInt(positionInfo.feeTier) : positionInfo.feeTier,
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
      <BodyWrapper>
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
          >
            <LiquidityPositionInfo positionInfo={positionInfo} linkToPool />
            {isOwner && (
              <Flex row gap="$gap12" alignItems="center" flexWrap="wrap">
                {positionInfo.version === ProtocolVersion.V3 &&
                  status !== PositionStatus.CLOSED &&
                  isV4DataEnabled &&
                  isMigrateToV4Enabled && (
                    <MouseoverTooltip
                      text={t('pool.migrateLiquidityDisabledTooltip')}
                      disabled={!showV4UnsupportedTooltip}
                      style={media.sm ? { width: '100%', display: 'block' } : {}}
                    >
                      <Button
                        size="small"
                        emphasis="secondary"
                        $sm={{ width: '100%' }}
                        isDisabled={showV4UnsupportedTooltip}
                        opacity={showV4UnsupportedTooltip ? 0.5 : 1}
                        onPress={() => {
                          navigate(`/migrate/v3/${chainInfo?.urlParam}/${tokenIdFromUrl}`)
                        }}
                      >
                        {t('pool.migrateToV4')}
                      </Button>
                    </MouseoverTooltip>
                  )}
                <Button
                  size="small"
                  emphasis="secondary"
                  $sm={{ width: '100%' }}
                  onPress={() => {
                    dispatch(
                      setOpenModal({
                        name: ModalName.AddLiquidity,
                        initialState: positionInfo,
                      }),
                    )
                  }}
                >
                  {t('common.addLiquidity')}
                </Button>
                {status !== PositionStatus.CLOSED && (
                  <Button
                    size="small"
                    $sm={{ width: '100%' }}
                    onPress={() => {
                      dispatch(
                        setOpenModal({
                          name: ModalName.RemoveLiquidity,
                          initialState: positionInfo,
                        }),
                      )
                    }}
                  >
                    {t('pool.removeLiquidity')}
                  </Button>
                )}
                {hasFees && isOwner && (
                  <Button
                    size="small"
                    maxWidth="fit-content"
                    onPress={() => {
                      if (hasFees) {
                        dispatch(
                          setOpenModal({
                            name: ModalName.ClaimFee,
                            initialState: positionInfo,
                          }),
                        )
                      }
                    }}
                  >
                    {t('pool.collectFees')}
                  </Button>
                )}
              </Flex>
            )}
          </Flex>
        </Flex>
        <Flex row justifyContent="space-between" $lg={{ row: false, gap: '$gap24' }}>
          <Flex gap="$gap12" width={chartWidth}>
            <Flex row gap="$gap8" alignItems="center">
              <BaseQuoteFiatAmount
                price={priceInverted ? token1CurrentPrice : token0CurrentPrice}
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
              borderBottomRightRadius="$rounded20"
              borderBottomWidth={mainView === 'chart' ? 1 : 0}
              borderRightWidth={mainView === 'chart' ? 1 : 0}
              pb="$padding12"
            >
              {mainView === 'chart' ? (
                <LiquidityPositionRangeChart
                  version={positionInfo.version}
                  currency0={priceInverted ? currency1Amount.currency : currency0Amount.currency}
                  currency1={priceInverted ? currency0Amount.currency : currency1Amount.currency}
                  poolAddressOrId={positionInfo.poolId}
                  chainId={positionInfo.chainId}
                  tickSpacing={positionInfo.tickSpacing}
                  feeTier={positionInfo.feeTier}
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
                <DropdownSelector
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
                </DropdownSelector>
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
                  <DropdownSelector
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
                  </DropdownSelector>
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
          </Flex>
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
            <Flex gap="$gap8">
              <Text color="$neutral2" variant="body2">
                <Trans i18nKey="pool.position" />
              </Text>
              {position.status === PositionStatus.CLOSED ? (
                <Text variant="heading2" $lg={{ variant: 'heading3' }}>
                  {formatCurrencyAmount({
                    amount: CurrencyAmount.fromRawAmount(currency0Amount.currency, 0),
                    type: NumberType.FiatTokenPrice,
                  })}
                </Text>
              ) : (
                <>
                  <Text variant="heading2" $lg={{ variant: 'heading3' }}>
                    {fiatValue0 && fiatValue1 ? (
                      formatCurrencyAmount({
                        amount: fiatValue0.add(fiatValue1),
                        type: NumberType.FiatTokenPrice,
                      })
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
                  <LiquidityPositionAmountRows
                    currency0Amount={currency0Amount}
                    currency1Amount={currency1Amount}
                    fiatValue0={fiatValue0}
                    fiatValue1={fiatValue1}
                  />
                </>
              )}
            </Flex>
            <Flex gap="$gap8">
              <Text color="$neutral2" variant="body2">
                <Trans i18nKey="common.fees" />
              </Text>
              {position.status === PositionStatus.CLOSED ? (
                <Text variant="heading2" $lg={{ variant: 'heading3' }}>
                  {formatCurrencyAmount({
                    amount: CurrencyAmount.fromRawAmount(currency0Amount.currency, 0),
                    type: NumberType.FiatTokenPrice,
                  })}
                </Text>
              ) : (
                <>
                  <Text variant="heading2" mt="$spacing8" mb="$spacing16" $lg={{ variant: 'heading3' }}>
                    {fiatFeeValue0 && fiatFeeValue1 ? (
                      formatCurrencyAmount({
                        amount: fiatFeeValue0.add(fiatFeeValue1),
                        type: NumberType.FiatTokenPrice,
                      })
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
                  {feeValue0 && feeValue1 && (
                    <LiquidityPositionAmountRows
                      currency0Amount={feeValue0}
                      currency1Amount={feeValue1}
                      fiatValue0={fiatFeeValue0}
                      fiatValue1={fiatFeeValue1}
                    />
                  )}
                </>
              )}
            </Flex>
          </Flex>
        </Flex>
      </BodyWrapper>
    </Trace>
  )
}
