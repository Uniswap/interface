import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import ScrollContainer from 'react-indiana-drag-scroll'

import { ChainId, WETH } from 'libs/sdk/src'
import { KNC, ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useThrottle from 'hooks/useThrottle'
import { useRewardTokenPrices } from 'state/farms/hooks'
import { formattedNum, getTokenLogoURL } from 'utils'
import { useRewardTokensFullInfo } from 'utils/dmm'

const RewardTokenPricesWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  max-width: calc(100% - 130px);

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
    background: linear-gradient(to right, ${({ theme }) => theme.bg12}, transparent);
    left: 0;
  }

  &.right-visible:before {
    background: linear-gradient(to left, ${({ theme }) => theme.bg12}, transparent);
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
  border-left: ${({ theme, isFirstItem }) => (isFirstItem ? 'none' : `1px solid ${theme.border4}`)};
  white-space: nowrap;
`

const TokenSymbol = styled.span`
  font-size: 14px;
  font-weight: 400;
  margin-right: 4px;
`

const StyledImg = styled.img`
  margin-right: 4px;
  background: #fff;
  border-radius: 50%;
  object-fit: contain;
`

const RewardTokenPrices = () => {
  const { chainId } = useActiveWeb3React()
  const rewardTokens = useRewardTokensFullInfo()

  // Sort the list of reward tokens in order: KNC -> Native token -> Other tokens
  rewardTokens.sort(function(tokenA, tokenB) {
    if (tokenA.address === KNC[chainId as ChainId].address) {
      return -1
    }

    if (tokenB.address === KNC[chainId as ChainId].address) {
      return 1
    }

    if (tokenA.address === ZERO_ADDRESS || tokenA.address === WETH[chainId as ChainId].address) {
      return -1
    }

    if (tokenB.address === ZERO_ADDRESS || tokenB.address === WETH[chainId as ChainId].address) {
      return 1
    }

    return 0
  })
  const rewardTokenPrices = useRewardTokenPrices(rewardTokens)

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

  return (
    <RewardTokenPricesWrapper ref={shadowRef}>
      <ScrollContainer innerRef={scrollRef} vertical={false} className="scroll-container" onScroll={handleShadow}>
        <RewardTokensList ref={contentRef}>
          {rewardTokens.map((token, index) => {
            return (
              <TokenWrapper
                key={token.address}
                isFirstItem={index === 0}
                isLastItem={index === rewardTokens?.length - 1}
              >
                <StyledImg src={`${getTokenLogoURL(token.address, chainId)}`} alt="logo" width="20px" height="20px" />
                <TokenSymbol>{token.symbol}:</TokenSymbol>
                <span>
                  {rewardTokenPrices[index] ? formattedNum(rewardTokenPrices[index]?.toString(), true) : 'N/A'}
                </span>
              </TokenWrapper>
            )
          })}
        </RewardTokensList>
      </ScrollContainer>
    </RewardTokenPricesWrapper>
  )
}

export default RewardTokenPrices
