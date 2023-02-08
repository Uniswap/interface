import { Currency } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useState } from 'react'
import { Repeat } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { Box } from 'rebass/styled-components'
import { ResponsiveContainer } from 'recharts-legacy'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { usePool } from 'hooks/usePools'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useHourlyRateData } from 'state/mint/proamm/hooks'
import { TimeframeOptions } from 'state/mint/proamm/type'
import { MEDIA_WIDTHS } from 'theme'
import { shortString } from 'utils/string'

import CandleStickChart from './CandleStickChart'
import DropdownSelect from './DropdownSelect'

const RelativeBox = styled(Box)`
  position: relative;
  width: 100%;
  height: calc(100% - 28.5px - 16px);
`

const ChartWrapper = styled.div`
  height: 579.5px;
  min-height: 579.5px;

  @media screen and (max-width: 600px) {
    height: 500px;
    min-height: 500px;
  }
`

const EmptyCard = styled.div<{ height: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  border-radius: 20px;
  color: ${({ theme }) => theme.text};
  height: ${({ height }) => height && height};
`

const OptionButton = styled.div<{ active?: boolean; disabled?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  height: 24px;
  width: 40px;
  white-space: nowrap;
  border-radius: 999px;
  font-size: 12px;
  background-color: ${({ active, theme }) => (active ? theme.background : theme.buttonBlack)};
  color: ${({ theme, active }) => (active ? theme.white : theme.text)};

  :hover {
    cursor: ${({ disabled }) => !disabled && 'pointer'};
  }
`

enum PRICE_CHART_VIEW {
  PRICE0 = 'PRICE0',
  PRICE1 = 'PRICE1',
}

const PoolPriceChart = ({
  currencyA,
  currencyB,
  feeAmount,
  show,
}: {
  currencyA: Currency | undefined | null
  currencyB: Currency | undefined | null
  feeAmount: FeeAmount | undefined | null
  show: boolean
}) => {
  const [priceView, setPriceView] = useState<PRICE_CHART_VIEW>(PRICE_CHART_VIEW.PRICE0)
  const [timeFrame, setTimeFrame] = useState<TimeframeOptions>(TimeframeOptions.WEEK)
  const [, poolData] = usePool(currencyA ?? undefined, currencyB ?? undefined, feeAmount ?? undefined)
  const poolAddress = useProAmmPoolInfo(currencyA, currencyB, feeAmount ?? undefined)
  const ratesDatas = useHourlyRateData(poolAddress, timeFrame)
  const [currentRate, setCurrentRate] = useState<{ price: string; time?: string } | null>(null)
  const theme = useTheme()

  const formattedSymbol0 = shortString(poolData?.token0?.symbol, 5)
  const formattedSymbol1 = shortString(poolData?.token1?.symbol, 5)

  const ratesData0 = ratesDatas?.[0]
  const ratesData1 = ratesDatas?.[1]
  const ratesData = priceView === PRICE_CHART_VIEW.PRICE0 ? ratesData0 : ratesData1
  const baseToken = priceView === PRICE_CHART_VIEW.PRICE0 ? poolData?.token1Price : poolData?.token0Price

  useEffect(() => {
    setCurrentRate(null)
  }, [ratesDatas])

  const { ALL_TIME: _0, THREE_MONTHS: _1, YEAR: _2, FOUR_HOURS: _3, THERE_DAYS: _4, ...timeframes } = TimeframeOptions
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  if (!show || !currencyA || !currencyB) return null
  if (ratesData?.length === 0) {
    return (
      <ChartWrapper>
        <EmptyCard height="300px">No historical data yet.</EmptyCard>
      </ChartWrapper>
    )
  }

  return (
    <ChartWrapper>
      {upToLarge ? (
        <Flex flexDirection="row" justifyContent="space-between" alignItems="flex-start">
          <Flex flexDirection="column" sx={{ gap: '8px' }}>
            {currentRate && (
              <>
                <Flex alignItems="center" sx={{ gap: '8px' }}>
                  <Row width="unset">
                    {priceView === PRICE_CHART_VIEW.PRICE0 && <CurrencyLogo currency={currencyA} size={'28px'} />}
                    <CurrencyLogo currency={currencyB} size={'28px'} />
                    {priceView === PRICE_CHART_VIEW.PRICE1 && <CurrencyLogo currency={currencyA} size={'28px'} />}
                  </Row>
                  <Flex alignItems="baseline" sx={{ gap: '4px' }}>
                    <Text fontSize={upToExtraSmall ? '16px' : '24px'}>{currentRate?.price}</Text>
                    {!upToExtraSmall && (
                      <Flex sx={{ gap: '8px' }}>
                        <Text fontSize="14px" color={theme.subText}>
                          {priceView === PRICE_CHART_VIEW.PRICE0
                            ? `${formattedSymbol0}/${formattedSymbol1}`
                            : `${formattedSymbol1}/${formattedSymbol0}`}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
                <Text fontSize="14px" color={theme.subText}>
                  {currentRate.time || `\u00A0`}
                </Text>
              </>
            )}
          </Flex>

          <DropdownSelect
            name={ApplicationModal.TIME_DROPDOWN}
            options={timeframes}
            active={timeFrame}
            setActive={setTimeFrame}
            color={theme.primary}
          />
        </Flex>
      ) : (
        <RowBetween mb="1rem">
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            {currentRate && (
              <>
                <AutoRow width="unset">
                  {priceView === PRICE_CHART_VIEW.PRICE0 && <CurrencyLogo currency={currencyA} size={'28px'} />}
                  <CurrencyLogo currency={currencyB} size={'28px'} />
                  {priceView === PRICE_CHART_VIEW.PRICE1 && <CurrencyLogo currency={currencyA} size={'28px'} />}
                </AutoRow>
                <Flex alignItems="baseline" sx={{ gap: '4px' }}>
                  <Text fontSize="24px">{currentRate?.price}</Text>
                  <Flex sx={{ gap: '8px' }}>
                    <Text fontSize="14px" color={theme.subText}>
                      {priceView === PRICE_CHART_VIEW.PRICE0
                        ? `${formattedSymbol0}/${formattedSymbol1}`
                        : `${formattedSymbol1}/${formattedSymbol0}`}
                    </Text>
                    {currentRate?.time ? (
                      <Text fontSize="14px" color={theme.subText}>
                        {currentRate?.time}
                      </Text>
                    ) : null}
                  </Flex>
                </Flex>
              </>
            )}
          </Flex>
          <AutoColumn justify="flex-end" gap="20px">
            <AutoRow justify="flex-end" align="flex-start" style={{ width: 'fit-content' }}>
              <OptionButton
                onClick={() =>
                  setPriceView(priceView =>
                    priceView === PRICE_CHART_VIEW.PRICE1 ? PRICE_CHART_VIEW.PRICE0 : PRICE_CHART_VIEW.PRICE1,
                  )
                }
              >
                <Repeat size={12} />
              </OptionButton>
              <OptionButton
                active={timeFrame === TimeframeOptions.ONE_DAY}
                onClick={() => setTimeFrame(TimeframeOptions.ONE_DAY)}
              >
                1D
              </OptionButton>
              <OptionButton
                active={timeFrame === TimeframeOptions.WEEK}
                onClick={() => setTimeFrame(TimeframeOptions.WEEK)}
              >
                1W
              </OptionButton>
              <OptionButton
                active={timeFrame === TimeframeOptions.MONTH}
                onClick={() => setTimeFrame(TimeframeOptions.MONTH)}
              >
                1M
              </OptionButton>
            </AutoRow>
          </AutoColumn>
        </RowBetween>
      )}

      {ratesData ? (
        <RelativeBox>
          <ResponsiveContainer width="100%" height="100%">
            <CandleStickChart
              data={ratesData}
              base={parseFloat(baseToken?.toSignificant(18) ?? '0')}
              width={undefined}
              onSetCurrentRate={setCurrentRate}
            />
          </ResponsiveContainer>
        </RelativeBox>
      ) : (
        <Flex justifyContent="center" height="100%" minHeight="100%" alignItems="center">
          <Loader size="40px" />
        </Flex>
      )}
    </ChartWrapper>
  )
}

export default PoolPriceChart
