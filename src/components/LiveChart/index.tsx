import React, { useState, useContext, useEffect, useMemo } from 'react'
import LineChart from './LineChart'
import AnimatingNumber from './AnimatingNumber'
import styled, { ThemeContext } from 'styled-components'
import { Flex, Text } from 'rebass'
import { Repeat } from 'react-feather'
import { Currency } from '@dynamic-amm/sdk'
import { Field } from 'state/swap/actions'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { useActiveWeb3React } from 'hooks'
import useLiveChartData, { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import { isMobile } from 'react-device-detect'
import WarningIcon from './WarningIcon'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import Loader from 'components/LocalLoader'
import CircleInfoIcon from './CircleInfoIcon'
import { Trans } from '@lingui/macro'
const LiveChartWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  ${!isMobile &&
    `@media only screen and (min-width: 768px) {
    width: 580px;
    height: auto;
  }`}
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
      ? `background-color: ${theme.primary}; color: ${theme.white};`
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
    return {
      chartColor: lastValue - firstValue >= 0 ? '#31CB9E' : '#FF537B',
      different: differentValue.toPrecision(6),
      differentPercent: ((differentValue / lastValue) * 100).toFixed(2)
    }
  }
  return {
    chartColor: '#31CB9E',
    different: 0,
    differentPercent: 0
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
    case LiveDataTimeframeEnum.SIXMONTHS:
      return 'Past 6 Months'
  }
}

function LiveChart({
  currencies,
  onRotateClick
}: {
  currencies: { [field in Field]?: Currency }
  onRotateClick?: () => void
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const nativeInputCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT] || undefined)
  const nativeOutputCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT] || undefined)
  const tokens = useMemo(
    () => [nativeInputCurrency, nativeOutputCurrency].map(currency => wrappedCurrency(currency, chainId)),
    [chainId, currencies]
  )
  const isWrappedToken = tokens[0]?.address === tokens[1]?.address
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const [timeFrame, setTimeFrame] = useState<LiveDataTimeframeEnum>(LiveDataTimeframeEnum.DAY)
  const { data: chartData, error, loading } = useLiveChartData(tokens, timeFrame)

  useEffect(() => {
    if (hoverValue !== null) {
      setHoverValue(null)
    }
  }, [chartData])

  const showingValue = hoverValue ?? (chartData[chartData.length - 1]?.value || 0)

  const { chartColor, different, differentPercent } = getDifferentValues(chartData, hoverValue)

  const renderTimeframes = () => {
    return (
      <Flex>
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
          <Flex justifyContent="space-between" alignItems="center">
            <Flex>
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
            {isMobile && renderTimeframes()}
          </Flex>
          <Flex justifyContent="space-between" alignItems="flex-start" marginTop={'5px'}>
            <Flex flexDirection="column" alignItems="flex-start">
              {showingValue === 0 || error ? (
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
                {showingValue === 0 || error ? (
                  <Text fontSize={12} color={theme.disableText}>
                    --
                  </Text>
                ) : (
                  <>
                    <Text fontSize={12} color={different >= 0 ? '#31CB9E' : '#FF537B'} marginRight="5px">
                      {different} ({differentPercent}%)
                    </Text>
                    <Text fontSize={12} color={theme.disableText}>
                      {getTimeFrameText(timeFrame)}
                    </Text>
                  </>
                )}
              </Flex>
            </Flex>
            {!isMobile && renderTimeframes()}
          </Flex>
          <div style={{ flex: 1, marginTop: '12px' }}>
            {loading || error ? (
              <Flex
                minHeight={isMobile ? '240px' : '292px'}
                flexDirection={'column'}
                alignItems={'center'}
                justifyContent={'center'}
                color={theme.disableText}
                style={{ gap: '16px' }}
              >
                {loading && <Loader />}
                {error && (
                  <>
                    <WarningIcon />
                    <Text fontSize={16}>
                      <Trans>Chart is unavailable</Trans>
                    </Text>
                  </>
                )}
              </Flex>
            ) : (
              <LineChart data={chartData} setHoverValue={setHoverValue} color={chartColor} timeFrame={timeFrame} />
            )}
          </div>
        </>
      )}
    </LiveChartWrapper>
  )
}

export default React.memo(LiveChart)
