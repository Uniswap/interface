import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId as UbeswapChainId, JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import { BigNumber } from 'ethers'
import { useToken } from 'hooks/Tokens'
import { useOrderBookContract, useOrderBookRewardDistributorContract } from 'hooks/useContract'
import { BPS_DENOMINATOR } from 'pages/LimitOrder'
import React from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'
import styled from 'styled-components'

import { ORDER_BOOK_ADDRESS, ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS } from '../../constants'
import useTheme from '../../hooks/useTheme'
import { useCancelOrderCallback } from '../../pages/LimitOrder/useCancelOrderCallback'
import { ExternalLink, LinkIcon, TYPE } from '../../theme'
import { RowFlat } from '../Row'

const Container = styled.div`
  background-color: ${({ theme }) => theme.bg1};
  margin-bottom: 2rem;
  padding-left: 0.5rem;
`

const SymbolContainer = styled.div`
  width: 75%;
`

const AssetSymbol = styled.div`
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.primary5};
  padding: 0.5rem;
`

const AssetRow = styled(RowFlat)`
  margin-bottom: 0.5rem;
`
const SellText = styled.div`
  font-weight: 700;
  margin-top: 0.25rem;
`

const OrderToFill = styled.div`
  font-weight: 300;
  font-size: 14px;
  margin-top: 0.25rem;
`

const StyledControlButton = styled.button`
  height: 24px;
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red2};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-left: 7rem;
  margin-right: 2rem;
  color: white;
  :hover {
    border: 1px solid ${({ theme }) => theme.red3};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.red3};
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-left: 0.4rem;
    margin-right: 0.1rem;
  `};
`

const AddressLink = styled(ExternalLink)`
  font-size: 0.825rem;
  color: ${({ theme }) => theme.text3};
  border-radius: 12px;
  width: 45%;
  padding: 0.25rem;
  margin-top: 0.5rem;
  border: 1px solid ${({ theme }) => theme.primary5};
  font-size: 0.825rem;
  display: flex;
  :hover {
    color: ${({ theme }) => theme.text2};
  }
`

const BaselineRow = styled(AssetRow)`
  align-items: baseline;
`

interface LimitOrderHistoryItemProps {
  item: {
    orderHash: string
    makingAmount: BigNumber
    takingAmount: BigNumber
    makerAsset: string
    takerAsset: string
    remaining: BigNumber
    isOrderOpen: boolean
    transactionHash: string
  }
  rewardCurrency: Token | undefined
}

export default function LimitOrderHistoryItem({ item, rewardCurrency }: LimitOrderHistoryItemProps) {
  const { network } = useContractKit()
  const chainId = network.chainId as unknown as UbeswapChainId
  const { callback: cancelOrder } = useCancelOrderCallback(item.orderHash)
  const theme = useTheme()
  const makerToken = useToken(item.makerAsset)
  const takerToken = useToken(item.takerAsset)

  const transactionLink = `${network.explorer}/tx/${item.transactionHash}`

  const orderBookContract = useOrderBookContract(ORDER_BOOK_ADDRESS[chainId as unknown as UbeswapChainId])
  const orderBookFee = useSingleCallResult(orderBookContract, 'fee', []).result?.[0]
  const rewardDistributorContract = useOrderBookRewardDistributorContract(
    ORDER_BOOK_REWARD_DISTRIBUTOR_ADDRESS[chainId]
  )
  // TODO: This should really be based on the latest rewardRate change event from the logs
  const rewardRate = useSingleCallResult(rewardDistributorContract, 'rewardRate', [makerToken?.address]).result?.[0]

  if (!makerToken || !takerToken) {
    return null
  }

  const makingAmount = new TokenAmount(makerToken, item.makingAmount.toString())
  const reward =
    rewardCurrency && rewardRate
      ? new TokenAmount(
          rewardCurrency,
          JSBI.divide(JSBI.multiply(makingAmount.raw, JSBI.BigInt(rewardRate.toString())), BPS_DENOMINATOR)
        )
      : undefined
  const takingAmount = new TokenAmount(takerToken, item.takingAmount.toString())
  const remaining = new TokenAmount(makerToken, item.remaining.toString())

  return (
    <Container>
      <BaselineRow>
        <SymbolContainer>
          <AssetRow>
            <AssetSymbol>{makerToken.symbol}</AssetSymbol>
            <TYPE.body
              color={theme.text2}
              style={{ display: 'inline', marginLeft: '10px', marginRight: '10px', paddingBottom: '0.5rem' }}
            >
              &#10140;
            </TYPE.body>
            <AssetSymbol>{takerToken.symbol}</AssetSymbol>
          </AssetRow>
        </SymbolContainer>
        {item.isOrderOpen && (
          <StyledControlButton onClick={() => cancelOrder && cancelOrder()}>Cancel</StyledControlButton>
        )}
      </BaselineRow>
      <SellText>
        {makingAmount.toSignificant(4)} {makerToken.symbol} for {takingAmount.toSignificant(4)} {takerToken.symbol}
      </SellText>
      {item.isOrderOpen && (
        <OrderToFill>
          Remaining Order to Fill: {remaining.toSignificant(4)} {makerToken.symbol}
        </OrderToFill>
      )}
      <OrderToFill>
        Order Placement Fee:{' '}
        {orderBookFee
          ? makingAmount.multiply(orderBookFee.toString()).divide(BPS_DENOMINATOR.toString()).toSignificant(4)
          : '-'}{' '}
        {makerToken.symbol}
      </OrderToFill>
      {reward?.greaterThan('0') ? (
        <OrderToFill>
          Order Reward: {reward.toSignificant(4)} {reward.currency.symbol}
        </OrderToFill>
      ) : (
        <OrderToFill>Order Reward: -</OrderToFill>
      )}
      {item.isOrderOpen && (
        <AddressLink href={transactionLink}>
          <LinkIcon size={16} />
          <span style={{ marginLeft: '4px' }}>View Transaction</span>
        </AddressLink>
      )}
    </Container>
  )
}
