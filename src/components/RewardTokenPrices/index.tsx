import { Currency, WETH } from '@kyberswap/ks-sdk-core'
import React, { useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import { ZERO_ADDRESS } from 'constants/index'
import { KNC } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useThrottle from 'hooks/useThrottle'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { formattedNumLong } from 'utils'

export const ScrollContainerWithGradient = styled.div<{ backgroundColor?: string }>`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: fit-content;
  width: 100%;
  max-width: calc(100vw - 32px);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: flex-start;
  `}

  &.left-visible:after,
  &.right-visible:before {
    content: '';
    display: block;
    z-index: 2;
    pointer-events: none;
    position: absolute;
    inset: 0 0 auto auto;
    width: 40px;
    height: 100%;
    top: 50%;
    transform: translateY(-50%);
  }

  &.left-visible:after {
    background: linear-gradient(
      to right,
      ${({ theme, backgroundColor }) => backgroundColor ?? theme.buttonBlack},
      transparent
    );
    left: 0;
  }

  &.right-visible:before {
    background: linear-gradient(
      to left,
      ${({ theme, backgroundColor }) => backgroundColor ?? theme.buttonBlack},
      transparent
    );
    right: 0;
  }
`

const RewardTokensList = styled.div`
  display: flex;
`

const TokenWrapper = styled.div<{ isFirstItem?: boolean; isLastItem?: boolean }>`
  display: flex;
  align-items: center;
  padding-left: ${({ isFirstItem }) => (isFirstItem ? '0' : '20px')};
  padding-right: ${({ isLastItem }) => (isLastItem ? '0' : '20px')};
  border-left: ${({ theme, isFirstItem }) => (isFirstItem ? 'none' : `1px solid ${theme.border}`)};
  white-space: nowrap;
`

const TokenSymbol = styled.span`
  margin-left: 4px;
  font-size: 14px;
  font-weight: 400;
  margin-right: 4px;
`

const RewardTokenPrices = ({ style = {}, rewardTokens }: { style?: React.CSSProperties; rewardTokens: Currency[] }) => {
  const { chainId } = useActiveWeb3React()
  // let rewardTokens = useRewardTokensFullInfo()
  const isContainETH = rewardTokens.findIndex(token => token.wrapped.address === ZERO_ADDRESS) >= 0
  const isContainWETH = rewardTokens.findIndex(token => token.wrapped.address === WETH[chainId].address) >= 0
  rewardTokens =
    isContainETH && isContainWETH
      ? rewardTokens.filter(token => token.wrapped.address !== WETH[chainId].address)
      : rewardTokens

  // Sort the list of reward tokens in order: KNC -> Native token -> Other tokens
  rewardTokens.sort(function (tokenA, tokenB) {
    if (tokenA.wrapped.address === KNC[chainId].address) {
      return -1
    }

    if (tokenB.wrapped.address === KNC[chainId].address) {
      return 1
    }

    if (tokenA.wrapped.address === ZERO_ADDRESS || tokenA.wrapped.address === WETH[chainId].address) {
      return -1
    }

    if (tokenB.wrapped.address === ZERO_ADDRESS || tokenB.wrapped.address === WETH[chainId].address) {
      return 1
    }

    return 0
  })
  const rewardTokenPrices = useTokenPrices(rewardTokens.map(item => item.wrapped.address))

  const scrollRef = useRef(null)
  const contentRef: any = useRef(null)
  const shadowRef: any = useRef(null)

  const handleShadow = useThrottle(() => {
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (contentRef.current?.scrollWidth - element?.scrollLeft > element?.clientWidth) {
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
  }, [chainId])

  if (!rewardTokens.length) return null

  return (
    <ScrollContainerWithGradient ref={shadowRef} style={style}>
      <ScrollContainer innerRef={scrollRef} vertical={false} className="scroll-container" onScroll={handleShadow}>
        <RewardTokensList ref={contentRef}>
          {rewardTokens.map((token, index) => {
            return (
              <TokenWrapper key={index} isFirstItem={index === 0} isLastItem={index === rewardTokens?.length - 1}>
                <CurrencyLogo currency={token} size="20px" />
                <TokenSymbol>{token.symbol}:</TokenSymbol>
                <span>
                  {rewardTokenPrices[token.wrapped.address]
                    ? formattedNumLong(rewardTokenPrices[token.wrapped.address], true)
                    : 'N/A'}
                </span>
              </TokenWrapper>
            )
          })}
        </RewardTokensList>
      </ScrollContainer>
    </ScrollContainerWithGradient>
  )
}

export default RewardTokenPrices
