import TradingView, { useTradingViewEvent } from './TradingView'
import useDebounce from 'hooks/useDebounce'
import React, { FC, useCallback, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { Currency } from '@uniswap/sdk-core'
import { Box } from 'react-feather'
import { Flex, FlexProps, Text } from 'rebass'
import { t } from '@lingui/macro'
import { LoadingView } from 'components/ModalViews'
import { LoadingRows } from 'pages/Pool/styleds'

const formatOptions = {
  notation: 'standard' as any,
  displayThreshold: 0.001,
  tokenPrecision: true,
}


const TokenDisplay: FC<{
    value?: number;
    inputSymbol?: string;
    outputSymbol?: string;
    children:any;
  }> = ({ value, inputSymbol, outputSymbol, children, ...props }: {
    value?: number;
    inputSymbol?: string;
    outputSymbol?: string;
    children:any;
  }) => {
  return value ? (
    <Flex alignItems="flex-end" flexWrap="wrap" {...props}>
      <Text fontSize="40px" mr="8px">
        {(value)}
      </Text>
      {inputSymbol && outputSymbol && (
        <Text color="textSubtle" fontSize="20px" mb="8px" mr="8px">
          {`${inputSymbol}/${outputSymbol}`}
        </Text>
      )}
      {children}
    </Flex>
  ) : (
    <LoadingRows>
        <div/>
        <div/>
        <div/>
    </LoadingRows> 
  )
}

interface TradingViewChartProps {
  isChartExpanded: boolean
  inputCurrency: Currency
  outputCurrency: Currency
  token0Address: string
  isMobile: boolean
  isDark: boolean
  currentSwapPrice: any
}

const TradingViewWrapper = styled.div<{ $show: boolean }>`
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  transition: opacity 0.2s ease-in;
  height: 100%;
`

const LoadingWrapper = styled.div<{ $isDark: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 1;
 
`

const bnbToWBNBSymbol = (sym: string) => (sym === 'BNB' ? 'WBNB' : sym)

const ID = 'TV_SWAP_CHART'

const TradingViewChart = ({
  isChartExpanded,
  outputCurrency,
  inputCurrency,
  token0Address,
  isMobile,
  isDark,
  
  currentSwapPrice,
}: TradingViewChartProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const token0Price = currentSwapPrice?.[token0Address]

  const [hasNoData, setHasNoData] = useState(false)

  const symbol = useMemo(() => {
    if (!(inputCurrency?.symbol && outputCurrency?.symbol)) {
      return null
    }
    const prefix = 'PANCAKESWAP:'
    const input = bnbToWBNBSymbol(inputCurrency.symbol)
    const output = bnbToWBNBSymbol(outputCurrency.symbol)
    return `${prefix}${input}${output}`
  }, [inputCurrency?.symbol, outputCurrency?.symbol])

  const onNoDataEvent = useCallback(() => {
    console.debug('No data from TV widget')
    setHasNoData(true)
  }, [])

  const onLoadedEvent = useCallback(() => {
    setIsLoading(false)
  }, [])

  useTradingViewEvent({
    id: ID,
    onNoDataEvent,
    onLoadedEvent,
  })

  // debounce the loading to wait for no data event from TV widget.
  // we cover the loading spinner over TV, let TV try to load data from pairs
  // if there's no no-data event coming between the debounce time, we assume the chart is loaded
  const debouncedLoading = useDebounce(isLoading, 800)

  return (
    <>
      <Flex
        flexDirection={['column', null, null, null, null, null, 'row']}
        alignItems={['flex-start', null, null, null, null, null, 'center']}
        justifyContent="space-between"
        height={isMobile ? '100%' : isChartExpanded ? 'calc(100% - 48px)' : '430px'}
      >
        <Flex flexDirection="column" pt="12px" height="100%" width="100%">
          <TokenDisplay 
            value={token0Price}
            inputSymbol={inputCurrency?.symbol}
            outputSymbol={outputCurrency?.symbol}
          ><></></TokenDisplay>
          <Box height="100%" >
            {hasNoData && (
              <Flex height="100%" justifyContent="center" alignItems="center" flexDirection="column">
                <Text  fontSize="20px" color="textDisabled" mt="16px">
                  {('TradingView chart not available')}
                </Text>
              </Flex>
            )}
            {(isLoading || debouncedLoading) && !hasNoData && (
              <LoadingWrapper $isDark={isDark}>
               <LoadingRows><div/><div/><div/><div/></LoadingRows>
              </LoadingWrapper>
            )}
            { (
              <TradingViewWrapper $show={!isLoading}>
                {symbol && <TradingView id={ID} symbol={symbol} />}
              </TradingViewWrapper>
            )}
          </Box>
        </Flex>
      </Flex>
    </>
  )
}

export default TradingViewChart