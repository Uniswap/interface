import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useEffect, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useTokenTopPoolsQuery } from 'services/geckoTermial'
import styled from 'styled-components'

import { ReactComponent as GeckoTerminalSVG } from 'assets/svg/geckoterminal.svg'
import { ReactComponent as GeckoTerminalLightSVG } from 'assets/svg/geckoterminal_light.svg'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/LocalLoader'
import TradingViewChart from 'components/TradingViewChart'
import { useActiveWeb3React } from 'hooks'
import useBasicChartData, { LiveDataTimeframeEnum } from 'hooks/useBasicChartData'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { useIsDarkMode } from 'state/user/hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import AnimatingNumber from './AnimatingNumber'
import CircleInfoIcon from './CircleInfoIcon'
import LineChart from './LineChart'
import ProChartToggle from './ProChartToggle'
import WarningIcon from './WarningIcon'

const LiveChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`
const TimeFrameButton = styled.div<{ active?: boolean }>`
  cursor: pointer;
  width: 26px;
  height: 24px;
  border-radius: 4px;
  line-height: 24px;
  margin-right: 5px;
  text-align: center;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ theme }) => theme.buttonBlack};
  transition: all 0.2s ease;
  ${({ theme, active }) =>
    active
      ? `background-color: ${theme.primary}; color: ${theme.textReverse};`
      : `
    &:hover {
      background-color: ${theme.buttonGray};
    }
  `}
`

const SwitchButtonWrapper = styled.div`
  display: flex;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: ${({ theme }) => theme.buttonGray};
  }
`

const getDifferentValues = (chartData: any, hoverValue: number | null) => {
  if (chartData && chartData.length > 0) {
    const firstValue = chartData[0].value
    const lastValue = chartData[chartData.length - 1].value
    const differentValue = hoverValue !== null ? hoverValue - lastValue : lastValue - firstValue
    const compareValue = hoverValue !== null ? lastValue : firstValue
    return {
      chartColor: lastValue - firstValue >= 0 ? '#31CB9E' : '#FF537B',
      different: differentValue.toPrecision(6),
      differentPercent: compareValue === 0 ? 100 : ((differentValue / compareValue) * 100).toFixed(2),
    }
  }
  return {
    chartColor: '#31CB9E',
    different: 0,
    differentPercent: 0,
  }
}

const getTimeFrameText = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return 'Past hour'
    case LiveDataTimeframeEnum.FOUR_HOURS:
      return 'Past 4 hours'
    case LiveDataTimeframeEnum.DAY:
      return 'Past 24 hours'
    case LiveDataTimeframeEnum.WEEK:
      return 'Past Week'
    case LiveDataTimeframeEnum.MONTH:
      return 'Past Month'
    case LiveDataTimeframeEnum.SIX_MONTHS:
      return 'Past 6 Months'
  }
}

function LiveChart({ currencies }: { currencies: { [field in Field]?: Currency } }) {
  const { isSolana, networkInfo } = useActiveWeb3React()
  const isDarkMode = useIsDarkMode()
  const theme = useTheme()
  const [currenciesState, setCurrenciesState] = useState(currencies)

  const {
    data: dataToken0,
    isLoading: prochartLoading1,
    error: errorToken0,
  } = useTokenTopPoolsQuery(
    {
      network: networkInfo.geckoTermialId || '',
      address: currencies[Field.INPUT]?.wrapped.address || '',
    },
    {
      skip: !networkInfo.geckoTermialId || !currencies[Field.INPUT]?.wrapped.address,
    },
  )
  const {
    data: dataToken1,
    isLoading: prochartLoading2,
    error: errorToken1,
  } = useTokenTopPoolsQuery(
    {
      network: networkInfo.geckoTermialId || '',
      address: currencies[Field.OUTPUT]?.wrapped.address || '',
    },
    {
      skip: !networkInfo.geckoTermialId || !currencies[Field.OUTPUT]?.wrapped.address,
    },
  )

  const prochartLoading = prochartLoading1 || prochartLoading2

  const isError = !!errorToken0 && !!errorToken1

  let commonPool = isError
    ? null
    : dataToken0?.data.find(
        item => !item.relationships.dex.data.id.includes('curve') && dataToken1?.data.map(i => i.id).includes(item.id),
      )

  if (!commonPool && !isError) {
    const token0 = `${networkInfo.geckoTermialId || ''}_${currencies[Field.INPUT]?.wrapped.address.toLowerCase() || ''}`
    const token1 = `${networkInfo.geckoTermialId || ''}_${
      currencies[Field.OUTPUT]?.wrapped.address.toLowerCase() || ''
    }`

    commonPool =
      dataToken0?.data.find(
        (item =>
          item.relationships.base_token.data.id === token0 && item.relationships.quote_token.data.id === token1) ||
          (item =>
            item.relationships.quote_token.data.id === token0 && item.relationships.base_token.data.id === token1),
      ) ||
      dataToken1?.data.find(
        (item =>
          item.relationships.base_token.data.id === token0 && item.relationships.quote_token.data.id === token1) ||
          (item =>
            item.relationships.quote_token.data.id === token0 && item.relationships.base_token.data.id === token1),
      )
  }

  useEffect(() => {
    setCurrenciesState(currencies)
  }, [currencies])

  const nativeInputCurrency = useCurrencyConvertedToNative(currenciesState[Field.INPUT] || undefined)
  const nativeOutputCurrency = useCurrencyConvertedToNative(currenciesState[Field.OUTPUT] || undefined)

  const tokens = useMemo(() => {
    return [nativeInputCurrency, nativeOutputCurrency].map(currency => currency?.wrapped)
  }, [nativeInputCurrency, nativeOutputCurrency])

  const isWrappedToken = !!tokens[0]?.address && tokens[0]?.address === tokens[1]?.address
  const isUnwrapingWSOL = isSolana && isWrappedToken && currencies[Field.INPUT]?.isToken
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [timeFrame, setTimeFrame] = useState<LiveDataTimeframeEnum>(LiveDataTimeframeEnum.DAY)

  const { data: chartData, error: basicChartError, loading: basicChartLoading } = useBasicChartData(tokens, timeFrame)
  const isProchartError = !commonPool
  const isBasicchartError = basicChartError && !basicChartLoading
  const bothChartError = isProchartError && isBasicchartError
  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (hoverValue !== null) {
      setHoverValue(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData])

  const showingValue = hoverValue ?? (chartData[chartData.length - 1]?.value || 0)

  const { chartColor, different, differentPercent } = getDifferentValues(chartData, hoverValue)

  const [isManualChange, setIsManualChange] = useState(false)
  const [isShowProChart, setIsShowProChart] = useState(false)

  const poolAddress = commonPool?.attributes.address
  useEffect(() => {
    if (!!poolAddress && !isManualChange) setIsShowProChart(true)
    if (!prochartLoading && !poolAddress) setIsShowProChart(false)
  }, [isShowProChart, isManualChange, poolAddress, prochartLoading])

  const renderTimeframes = () => {
    return (
      <Flex marginTop={'5px'}>
        {[...Object.values(LiveDataTimeframeEnum)].map(item => {
          return (
            <TimeFrameButton key={item} onClick={() => setTimeFrame(item)} active={timeFrame === item}>
              {item}
            </TimeFrameButton>
          )
        })}
      </Flex>
    )
  }

  const toggle = useMemo(() => {
    return (
      <ProChartToggle
        activeName={isShowProChart ? 'pro' : 'basic'}
        toggle={(name: string) => {
          if (!bothChartError && name !== (isShowProChart ? 'pro' : 'basic')) {
            if (name === 'pro') {
              mixpanelHandler(MIXPANEL_TYPE.PRO_CHART_CLICKED)
            } else {
              mixpanelHandler(MIXPANEL_TYPE.BASIC_CHART_CLICKED)
            }
            setIsManualChange(true)
            setIsShowProChart(prev => !prev)
          }
        }}
        buttons={[
          { name: 'basic', title: 'Basic', disabled: isBasicchartError },
          { name: 'pro', title: 'Pro', disabled: isProchartError },
        ]}
      />
    )
  }, [isBasicchartError, isProchartError, isShowProChart, bothChartError, mixpanelHandler])

  const isReverse =
    commonPool?.relationships?.base_token.data.id ===
    networkInfo.geckoTermialId + '_' + nativeOutputCurrency?.wrapped?.address.toLowerCase()

  const label = `${nativeInputCurrency?.symbol} / ${nativeOutputCurrency?.symbol}`

  return (
    <LiveChartWrapper>
      {isWrappedToken ? (
        <Flex
          minHeight={isMobile ? '380px' : '440px'}
          flexDirection={'column'}
          alignItems={'center'}
          justifyContent={'center'}
          color={theme.border}
          sx={{ gap: '16px' }}
        >
          <CircleInfoIcon />
          <Text fontSize={16} textAlign={'center'}>
            {isUnwrapingWSOL ? (
              <Trans>You can only swap all WSOL to SOL</Trans>
            ) : (
              <Trans>
                You can swap {nativeInputCurrency?.symbol} for {nativeOutputCurrency?.symbol} (and vice versa)
              </Trans>
            )}
            <br />
            <Trans>Exchange rate is always 1 to 1.</Trans>
          </Text>
        </Flex>
      ) : (
        <>
          <Flex justifyContent="space-between" alignItems="center" paddingY="4px">
            <Flex flex={isMobile ? 2 : 1}>
              <DoubleCurrencyLogo
                currency0={nativeInputCurrency}
                currency1={nativeOutputCurrency}
                size={24}
                margin={true}
              />
              <Flex alignItems="center" fontSize={isMobile ? 14 : 18} color={theme.subText}>
                <Flex alignItems="center">
                  <Text fontSize={isMobile ? 18 : 24} fontWeight={500} color={theme.text}>
                    {nativeInputCurrency?.symbol}
                  </Text>
                  <Text marginLeft="4px" style={{ whiteSpace: 'nowrap' }}>
                    {' / '}
                    {nativeOutputCurrency?.symbol}
                  </Text>
                </Flex>
                <SwitchButtonWrapper
                  onClick={() =>
                    setCurrenciesState(prev => {
                      return { INPUT: prev[Field.OUTPUT], OUTPUT: prev[Field.INPUT] }
                    })
                  }
                >
                  <Repeat size={14} />
                </SwitchButtonWrapper>
              </Flex>
            </Flex>
            <Flex flex={1} justifyContent="flex-end">
              {toggle}
            </Flex>
          </Flex>

          {/* Stop tradingview from rerender on isShowProChart change */}
          <div style={{ display: isShowProChart && !!poolAddress ? 'block' : 'none', height: '100%' }}>
            {commonPool && <TradingViewChart poolDetail={commonPool} isReverse={isReverse} label={label} />}
            <Flex justifyContent="flex-end" sx={{ gap: '0.5rem' }}>
              <Text color={theme.subText} fontSize="10px">
                Powered by
              </Text>
              {isDarkMode ? (
                <GeckoTerminalSVG style={{ width: '75px' }} />
              ) : (
                <GeckoTerminalLightSVG style={{ width: '75px' }} />
              )}
            </Flex>
          </div>

          {!isShowProChart && (
            <>
              <Flex justifyContent="space-between" alignItems="flex-start" marginTop="12px">
                <Flex flexDirection="column" alignItems="flex-start">
                  {showingValue === 0 || basicChartError ? (
                    <Text fontSize={28} color={theme.subText}>
                      --
                    </Text>
                  ) : (
                    <AnimatingNumber
                      value={showingValue}
                      symbol={nativeOutputCurrency?.symbol}
                      fontSize={isMobile ? 24 : 28}
                    />
                  )}
                  <Flex marginTop="2px">
                    {showingValue === 0 || basicChartError ? (
                      <Text fontSize={12} color={theme.disableText}>
                        --
                      </Text>
                    ) : (
                      <>
                        <Text fontSize={12} color={different >= 0 ? '#31CB9E' : '#FF537B'} marginRight="5px">
                          {different} ({differentPercent}%)
                        </Text>
                        {!hoverValue && (
                          <Text fontSize={12} color={theme.disableText}>
                            {getTimeFrameText(timeFrame)}
                          </Text>
                        )}
                      </>
                    )}
                  </Flex>
                </Flex>
                {!isMobile && renderTimeframes()}
              </Flex>
              {isMobile && renderTimeframes()}
              <div style={{ flex: 1, marginTop: '12px' }}>
                {basicChartLoading || isBasicchartError ? (
                  <Flex
                    minHeight={isMobile ? '300px' : '370px'}
                    flexDirection={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    color={theme.disableText}
                    style={{ gap: '16px' }}
                  >
                    {basicChartLoading ? (
                      <Loader />
                    ) : (
                      isBasicchartError && (
                        <>
                          <WarningIcon />
                          <Text fontSize={16}>
                            <Trans>Chart is unavailable right now</Trans>
                          </Text>
                        </>
                      )
                    )}
                  </Flex>
                ) : (
                  <LineChart
                    data={chartData}
                    setHoverValue={setHoverValue}
                    color={chartColor}
                    timeFrame={timeFrame}
                    minHeight={370}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </LiveChartWrapper>
  )
}

export default React.memo(LiveChart)
