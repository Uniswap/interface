import React, { useState, useContext, useEffect, useMemo } from 'react'
import LineChart from './LineChart'
import AnimatingNumber from './AnimatingNumber'
import styled, { ThemeContext } from 'styled-components'
import { Flex, Text } from 'rebass'
import { Repeat } from 'react-feather'
import { Currency } from '@kyberswap/ks-sdk-core'
import { Field } from 'state/swap/actions'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import useLiveChartData, { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import { isMobile } from 'react-device-detect'
import WarningIcon from './WarningIcon'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import Loader from 'components/LocalLoader'
import CircleInfoIcon from './CircleInfoIcon'
import { Trans } from '@lingui/macro'
import ProChartToggle from 'components/LiveChart/ProChartToggle'
import { useShowProLiveChart, useToggleProLiveChart } from 'state/user/hooks'
import ProLiveChart from 'components/TradingViewChart'
import { checkPairHasDextoolsData } from 'components/TradingViewChart/datafeed'
import { useActiveWeb3React } from 'hooks'
import { useMedia } from 'react-use'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

const LiveChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
  background-color: ${({ theme }) => theme.bg12};
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

const ProLiveChartCustom = styled(ProLiveChart)<{ $isShowProChart: boolean }>`
  margin: ${() => (isMobile ? '0 -20px -20px -20px' : '15px 0 25px 0 !important')};
  display: ${({ $isShowProChart }) => ($isShowProChart ? 'block' : 'none')};
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

function LiveChart({
  currencies,
  onRotateClick,
  mobileCloseButton,
}: {
  currencies: { [field in Field]?: Currency }
  onRotateClick?: () => void
  mobileCloseButton?: React.ReactNode
}) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const nativeInputCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT] || undefined)
  const nativeOutputCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT] || undefined)
  const tokens = useMemo(() => {
    return [nativeInputCurrency, nativeOutputCurrency].map(currency => currency?.wrapped)
  }, [nativeInputCurrency, nativeOutputCurrency])

  const isWrappedToken = tokens[0]?.address === tokens[1]?.address
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [timeFrame, setTimeFrame] = useState<LiveDataTimeframeEnum>(LiveDataTimeframeEnum.DAY)
  const [stateProChart, setStateProChart] = useState({
    hasProChart: false,
    pairAddress: '',
    apiVersion: '',
    loading: true,
  })
  const { hasProChart, loading: proChartLoading } = stateProChart
  const { data: chartData, error: basicChartError, loading: basicChartLoading } = useLiveChartData(tokens, timeFrame)
  const showProChartStore = useShowProLiveChart()
  const toggleProLiveChart = useToggleProLiveChart()
  const above400 = useMedia('(min-width:400px)')
  const { mixpanelHandler } = useMixpanel()
  useEffect(() => {
    if (hoverValue !== null) {
      setHoverValue(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData])
  useEffect(() => {
    setStateProChart({ hasProChart: false, pairAddress: '', apiVersion: '', loading: true })

    checkPairHasDextoolsData(currencies, chainId)
      .then((res: any) => {
        if ((res.ver || res.ver === 0) && res.pairAddress) {
          setStateProChart({ hasProChart: true, pairAddress: res.pairAddress, apiVersion: res.ver, loading: false })
        } else {
          setStateProChart({ hasProChart: false, pairAddress: '', apiVersion: '', loading: false })
        }
      })
      .catch(error => console.log(error))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(currencies)])

  const showingValue = hoverValue ?? (chartData[chartData.length - 1]?.value || 0)

  const { chartColor, different, differentPercent } = getDifferentValues(chartData, hoverValue)

  const isShowProChart = showProChartStore && (hasProChart || proChartLoading || basicChartError)

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

  return (
    <LiveChartWrapper>
      {isWrappedToken ? (
        <Flex
          minHeight={isMobile ? '380px' : '440px'}
          flexDirection={'column'}
          alignItems={'center'}
          justifyContent={'center'}
          color={theme.disableText}
          style={{ gap: '16px' }}
        >
          <CircleInfoIcon />
          <Text fontSize={16} textAlign={'center'}>
            <Trans>
              You can swap {nativeInputCurrency?.symbol} for {nativeOutputCurrency?.symbol} (and vice versa) with no
              trading fees. <br />
              Exchange rate is always 1 to 1.
            </Trans>
          </Text>
        </Flex>
      ) : (
        <>
          {!above400 && mobileCloseButton}
          <Flex justifyContent="space-between" alignItems="center">
            <Flex flex={1}>
              <DoubleCurrencyLogo
                currency0={nativeInputCurrency}
                currency1={nativeOutputCurrency}
                size={24}
                margin={true}
              />
              <Flex alignItems="center" fontSize={isMobile ? 14 : 18} color={theme.subText}>
                <span style={{ marginRight: '8px' }}>
                  <Text fontSize={isMobile ? 18 : 24} fontWeight={500} color={theme.text} display="inline-block">
                    {nativeInputCurrency?.symbol}
                  </Text>
                  <span style={{ whiteSpace: 'nowrap' }}>{' / ' + nativeOutputCurrency?.symbol}</span>
                </span>
                <SwitchButtonWrapper onClick={onRotateClick}>
                  <Repeat size={14} />
                </SwitchButtonWrapper>
              </Flex>
            </Flex>

            <Flex flex={1} justifyContent="flex-end">
              <ProChartToggle
                activeName={isShowProChart ? 'pro' : 'basic'}
                toggle={(name: string) => {
                  if (!basicChartError && hasProChart) {
                    if (name !== (isShowProChart ? 'pro' : 'basic')) {
                      if (name === 'pro') {
                        mixpanelHandler(MIXPANEL_TYPE.PRO_CHART_CLICKED)
                      } else {
                        mixpanelHandler(MIXPANEL_TYPE.BASIC_CHART_CLICKED)
                      }
                      toggleProLiveChart()
                    }
                  }
                }}
                buttons={[
                  { name: 'basic', title: 'Basic', disabled: basicChartError },
                  { name: 'pro', title: 'Pro', disabled: !hasProChart },
                ]}
                bgColor={isMobile ? 'buttonBlack' : 'background'}
              />
            </Flex>
            {above400 && mobileCloseButton}
          </Flex>
          <ProLiveChartCustom
            currencies={Object.values(currencies)}
            stateProChart={stateProChart}
            $isShowProChart={isShowProChart}
          />
          {!isShowProChart && (
            <>
              <Flex justifyContent="space-between" alignItems="flex-start" marginTop={'5px'}>
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
              {isMobile && !showProChartStore && renderTimeframes()}
              <div style={{ flex: 1, marginTop: '12px' }}>
                {basicChartLoading || basicChartError ? (
                  <Flex
                    minHeight={isMobile ? '300px' : '370px'}
                    flexDirection={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    color={theme.disableText}
                    style={{ gap: '16px' }}
                  >
                    {basicChartLoading && <Loader />}
                    {basicChartError && (
                      <>
                        <WarningIcon />
                        <Text fontSize={16}>
                          <Trans>Chart is unavailable</Trans>
                        </Text>
                      </>
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
