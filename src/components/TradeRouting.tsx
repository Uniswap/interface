import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'
import styled, { css } from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import { useActiveWeb3React } from 'hooks'
import useThrottle from 'hooks/useThrottle'
import { Dex } from 'state/customizeDexes'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { getEtherscanLink, isAddress } from 'utils'
import { SwapPool, SwapRouteV2 } from 'utils/aggregationRouting'

const getDexInfoByPool = (pool: SwapPool, allDexes?: Dex[]) => {
  if (pool.exchange === '1inch') {
    return { name: '1inch', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8104.png' }
  }

  if (pool.exchange === 'paraswap') {
    return { name: 'Paraswap', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14534.png' }
  }

  if (pool.exchange === '0x') {
    return { name: '0x', logoURL: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1896.png' }
  }

  return allDexes?.find(
    dex =>
      dex.id === pool.exchange ||
      ((pool.exchange === 'kyberswap' || pool.exchange === 'kyberswap-static') && dex.id === 'kyberswapv1'), // Mapping for kyberswap classic dex
  )
}

const Shadow = styled.div<{ backgroundColor?: string }>`
  position: relative;
  min-height: 0;
  overflow: hidden;

  &:before,
  &:after {
    content: '';
    display: block;
    z-index: 3;
    pointer-events: none;
    position: absolute;
    height: 50px;
    width: 100%;
    left: 50%;
    transform: translateX(-50%);
    transition: all 0.2s ease;
    opacity: 0;
  }

  &:before {
    background: linear-gradient(to bottom, ${({ backgroundColor }) => backgroundColor}, transparent);
    top: 0;
  }

  &:after {
    background: linear-gradient(to top, ${({ backgroundColor }) => backgroundColor}, transparent);
    bottom: 0;
  }

  &.top:before,
  &.bottom:after {
    opacity: 1;
  }
`
const StyledContainer = styled.div`
  flex: 1;
  max-height: 100%;
  max-width: 100%;
  margin-left: 0;
  overflow-y: scroll;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track-piece {
    background: transparent;
  }
`

const StyledPair = styled.div`
  position: relative;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const StyledPairLine = styled.div`
  flex: auto;
  min-width: 50px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  height: 1px;
`
const StyledWrapToken = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 100px;
  width: max-content;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  min-height: 38px;
  border-radius: 0.5rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 120px;
  `}
`
const StyledToken = styled.a<{ reverse?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  ${({ reverse }) =>
    reverse &&
    css`
      flex-direction: row-reverse;
      justify-content: flex-start;
    `}
  padding-bottom: 7px;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  & > span {
    margin-left: 4px;
    margin-right: 4px;
  }
`
const StyledRoutes = styled.div`
  margin: auto;
  width: 100%;
  position: relative;
  padding: 20px 10px 0;

  &:before {
    position: absolute;
    display: block;
    content: '';
    top: 0;
    right: 0;
  }
`
const StyledRoute = styled.div`
  display: flex;
  justify-content: flex-end;
  position: relative;
  align-items: center;

  &:before,
  &:after {
    content: '';
    display: block;
    border-left: 1px solid ${({ theme }) => theme.border};
    width: 100%;
    height: calc(50% + 20px);
    position: absolute;
    border-right: 1px solid ${({ theme }) => theme.border};
    box-sizing: border-box;
    pointer-events: none;
  }

  &:before {
    top: -20px;
  }

  &:after {
    bottom: -10px;
  }

  &:last-child:after {
    display: none;
  }
`
const StyledRouteLine = styled.div`
  position: absolute;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  width: calc(100% - 68px);
  left: 43px;
`
const StyledHops = styled.div<{ length: string | number }>`
  z-index: 1;
  display: flex;
  align-items: center;
`

const StyledHop = styled.div`
  padding: 8px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  height: fit-content;
  position: relative;
  flex: 0 0 146px;
  margin: auto;
  transition: filter 0.15s ease;
  cursor: pointer;

  :hover {
    filter: ${({ theme }) => (theme.darkMode ? 'brightness(130%)' : 'brightness(97%)')};
  }
`
const StyledExchange = styled.a`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0;
  margin-top: 4px;
  font-size: 10px;
  border-radius: 8px;
  color: ${({ theme }) => theme.subText};
  line-height: 20px;
  white-space: nowrap;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => (theme.darkMode ? theme.white : theme.black)};
  }

  & > .img--sm {
    width: 14px;
    height: 14px;
    border-radius: 100%;
    margin-right: 4px;
  }

  &:first-child {
    margin-top: 8px;
  }
`
const StyledExchangeStatic = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0;
  margin-top: 4px;
  font-size: 10px;
  border-radius: 8px;
  color: ${({ theme }) => theme.subText};
  line-height: 20px;
  white-space: nowrap;
  text-decoration: none;

  & > .img--sm {
    width: 14px;
    height: 14px;
    border-radius: 100%;
    margin-right: 4px;
  }

  &:first-child {
    margin-top: 8px;
  }
`

const StyledPercent = styled.div<{ backgroundColor?: string }>`
  font-size: 12px;
  line-height: 14px;
  font-weight: 700;
  position: absolute;
  top: calc(50% - 15px);
  left: 8px;
  transform: translateY(50%);
  z-index: 2;
  color: ${({ theme }) => theme.primary};
  background: ${({ backgroundColor }) => backgroundColor};
`
const StyledDot = styled.i<{ out?: boolean }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  position: absolute;
  top: 0;
  left: ${({ out }) => (out ? 'unset' : '6.5px')};
  right: ${({ out }) => (out ? '6.5px' : 'unset')};
  z-index: 1;
  background-color: ${({ theme }) => theme.primary};
`
const StyledWrap = styled.div<{ backgroundColor?: string }>`
  width: calc(100% - 68px);
  margin: 10px 0 10px 6px;

  &:after,
  &:before {
    transition: all 0.1s ease;
    content: '';
    display: block;
    z-index: 2;
    pointer-events: none;
    position: absolute;
    inset: 0 0 auto auto;
    width: 40px;
    height: calc(100% - 20px);
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
  }

  &:after {
    background: linear-gradient(to right, ${({ backgroundColor }) => backgroundColor}, transparent);
    left: 42px;
  }

  &:before {
    background: linear-gradient(to left, ${({ backgroundColor }) => backgroundColor}, transparent);
    right: 24px;
  }

  &.left-visible:after,
  &.right-visible:before {
    opacity: 1;
  }
`

const StyledHopChevronRight = styled.div`
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 5px solid ${({ theme }) => theme.primary};
`

const StyledHopChevronWrapper = styled.div`
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
`

const getSwapPercent = (percent?: number, routeNumber = 0): string | null => {
  if (routeNumber === 1) {
    return '100%'
  }
  if (!percent && percent !== 0) {
    return null
  }
  const val = routeNumber > 1 ? Math.min(99.99, Math.max(0.01, percent)) : percent
  return `${val.toFixed(0)}%`
}

interface RouteRowProps {
  route: SwapRouteV2
  chainId: ChainId
  backgroundColor?: string
}

const RouteRow = ({ route, chainId, backgroundColor }: RouteRowProps) => {
  const scrollRef = useRef(null)
  const contentRef: any = useRef(null)
  const shadowRef: any = useRef(null)

  const allDexes = useAllDexes()

  const handleShadow = useThrottle(() => {
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (Math.floor(contentRef.current?.scrollWidth - element?.scrollLeft) > Math.floor(element?.clientWidth)) {
      shadowRef.current?.classList.add('right-visible')
    } else {
      shadowRef.current?.classList.remove('right-visible')
    }
  }, 300)

  useEffect(() => {
    window.addEventListener('resize', handleShadow)
    return () => window.removeEventListener('resize', handleShadow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    handleShadow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  return (
    <StyledWrap ref={shadowRef} backgroundColor={backgroundColor}>
      <ScrollContainer innerRef={scrollRef} vertical={false} onScroll={handleShadow}>
        <StyledHops length={route?.subRoutes?.length} ref={contentRef}>
          {route.subRoutes.map((subRoute, index, arr) => {
            const token = route.path[index + 1]
            const id = subRoute
              .flat()
              .map(item => item.id)
              .join('-')

            return (
              <React.Fragment key={id}>
                <StyledHop>
                  <StyledToken
                    style={{ marginRight: 0 }}
                    href={getEtherscanLink(chainId, token?.address, 'token')}
                    target="_blank"
                  >
                    <CurrencyLogo currency={token} size="16px" />
                    <span>{token?.symbol}</span>
                  </StyledToken>
                  {Array.isArray(subRoute)
                    ? subRoute.map(pool => {
                        const dex = getDexInfoByPool(pool, allDexes)
                        const link = (i => {
                          // TODO: Dungz remove condition
                          return isAddress(chainId, pool.id) && !['1inch', 'paraswap', '0x'].includes(pool.exchange) ? (
                            <StyledExchange
                              key={`${i}-${pool.id}`}
                              href={getEtherscanLink(chainId, pool.id, 'address')}
                              target="_blank"
                            >
                              {i}
                            </StyledExchange>
                          ) : (
                            <StyledExchangeStatic key={`${i}-${pool.id}`}>{i}</StyledExchangeStatic>
                          )
                        })(
                          <>
                            {dex?.logoURL ? (
                              <img src={dex?.logoURL} alt="" className="img--sm" />
                            ) : (
                              <i className="img--sm" />
                            )}
                            {`${dex?.name || '--'}: ${pool.swapPercentage}%`}
                          </>,
                        )
                        return link
                      })
                    : null}
                </StyledHop>
                {index !== arr.length - 1 && (
                  <StyledHopChevronWrapper>
                    <StyledHopChevronRight />
                  </StyledHopChevronWrapper>
                )}
              </React.Fragment>
            )
          })}
        </StyledHops>
      </ScrollContainer>
    </StyledWrap>
  )
}

interface RoutingProps {
  maxHeight?: string

  tradeComposition: SwapRouteV2[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
}

const Routing = ({ tradeComposition, maxHeight, inputAmount, outputAmount, currencyIn, currencyOut }: RoutingProps) => {
  const { chainId } = useActiveWeb3React()
  const shadowRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const renderTokenInfo = (
    currency: Currency | undefined,
    amount: CurrencyAmount<Currency> | undefined,
    reverseOrder?: boolean,
  ) => {
    if (chainId && currency) {
      return (
        <StyledToken as="div" reverse={reverseOrder} style={{ border: 'none' }}>
          <CurrencyLogo currency={currency} size="20px" />
          <span>{`${amount ? amount.toSignificant(6) : ''} ${currency.symbol}`}</span>
        </StyledToken>
      )
    }

    return null
  }

  const hasRoutes = chainId && tradeComposition && tradeComposition.length > 0

  const handleScroll = useCallback(() => {
    const element = wrapperRef.current
    if ((element?.scrollTop ?? 0) > 0) {
      shadowRef?.current?.classList.add('top')
    } else {
      shadowRef?.current?.classList.remove('top')
    }
    if ((contentRef.current?.scrollHeight ?? 0) - (element?.scrollTop ?? 0) > (element?.clientHeight ?? 0)) {
      shadowRef.current?.classList.add('bottom')
    } else {
      shadowRef.current?.classList.remove('bottom')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    handleScroll()
  }, [tradeComposition, maxHeight, handleScroll])

  return (
    <Shadow ref={shadowRef}>
      <StyledContainer ref={wrapperRef} onScroll={handleScroll} style={{ maxHeight: maxHeight || '100%' }}>
        <div ref={contentRef}>
          <StyledPair>
            <StyledWrapToken>{renderTokenInfo(currencyIn, inputAmount)}</StyledWrapToken>
            {!hasRoutes && <StyledPairLine />}
            <StyledWrapToken>{renderTokenInfo(currencyOut, outputAmount, true)}</StyledWrapToken>
          </StyledPair>

          {tradeComposition && chainId && tradeComposition && tradeComposition.length > 0 ? (
            <div>
              <StyledRoutes>
                <StyledDot />
                <StyledDot out />
                {tradeComposition.map(route => (
                  <StyledRoute key={route.id}>
                    <StyledPercent>{getSwapPercent(route.swapPercentage, tradeComposition.length)}</StyledPercent>
                    <StyledRouteLine />
                    <RouteRow route={route} chainId={chainId} />
                    <StyledHopChevronWrapper style={{ marginRight: '2px' }}>
                      <StyledHopChevronRight />
                    </StyledHopChevronWrapper>
                  </StyledRoute>
                ))}
              </StyledRoutes>
            </div>
          ) : null}
        </div>
      </StyledContainer>
    </Shadow>
  )
}

export default memo(Routing)
