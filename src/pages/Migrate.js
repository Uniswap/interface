import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'

import { useAllBalances } from '../contexts/Balances'
import { useAllTokenDetails, useTokenDetails } from '../contexts/Tokens'
import { useWeb3React } from '../hooks'

import Card from '../components/CardStyled'
import LoaderLight from '../components/Loader'
import TextBlock from '../components/Text'
import PoolUnit from '../components/PoolUnit'

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 1rem 0;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
`

const shine = keyframes`
   from { background-position: 100%}
    to {background-position: -100%}
`

const LoadingCard = styled(Card)`
  background-image: linear-gradient(90deg, #f2f2f2 0px, #f8f8f8 20%, #f2f2f2 50%);
  background-size: 200%;
  animation: ${shine} 0.8s infinite linear;
  margin-top: 20px;
`

const Input = styled.input`
  border-radius: 20px;
  font-size: 16px;
  border: 1px solid ${({ theme }) => theme.colors.grey3};
  color: ${({ theme }) => theme.colors.grey5};
  padding: 20px 10px;
  outline: none;
  -webkit-appearance: none;
  margin-bottom: 20px;
`

function Migrate() {
  const { account } = useWeb3React()

  const allBalances = useAllBalances()
  const allTokenDetails = useAllTokenDetails()

  const [v1Shares, setV1Shares] = useState(new Set())
  const [v2Shares, setV2Shares] = useState(new Set())

  const [userInput, setUserInput] = useState()
  useTokenDetails(userInput)

  const poolAmount = Array.from(v1Shares).length + Array.from(v2Shares).length
  const fetching = !(allBalances && allBalances[account])

  useEffect(() => {
    if (allTokenDetails && allBalances) {
      let newV1Shares = v1Shares
      let newV2Shares = v2Shares
      Object.keys(allTokenDetails).forEach(tokenAddress => {
        let exchangeAddress = allTokenDetails[tokenAddress].exchangeAddress
        let exchangeAddressV2 = allTokenDetails[tokenAddress].exchangeAddressV2
        // get v1 LP shares
        if (
          allBalances[account] &&
          allBalances[account][exchangeAddress] &&
          allBalances[account][exchangeAddress].value
        ) {
          const balanceBigNumber = ethers.utils.bigNumberify(allBalances[account][exchangeAddress].value)
          if (!balanceBigNumber.isZero()) {
            newV1Shares.add(tokenAddress)
          }
        }
        // get v2 LP shares
        if (
          allBalances[account] &&
          allBalances[account][exchangeAddressV2] &&
          allBalances[account][exchangeAddressV2].value
        ) {
          const balanceBigNumber = ethers.utils.bigNumberify(allBalances[account][exchangeAddressV2].value)
          if (!balanceBigNumber.isZero()) {
            newV2Shares.add(tokenAddress)
          }
        }
      })
      setV1Shares(newV1Shares)
      setV2Shares(newV2Shares)
    }
  }, [account, allBalances, allTokenDetails, v1Shares, v2Shares])

  return (
    <Column>
      <Row>
        <TextBlock fontSize={24} fontWeight={500}>
          Your Liquidity
        </TextBlock>
        <TextBlock fontSize={16} color={'grey3'}>
          {fetching ? (
            <Row>
              Fetching balances <LoaderLight style={{ marginLeft: '10px' }} />
            </Row>
          ) : (
            poolAmount + ' pools found'
          )}
        </TextBlock>
      </Row>
      <TextBlock padding={'1rem 0'}>Dont see your liquidity? Enter a token address here.</TextBlock>
      <Input
        onChange={e => {
          setUserInput(e.target.value)
        }}
        placeholder={'Search token address'}
      />
      {fetching ? (
        <Column>
          <LoadingCard height={80} />
          <LoadingCard height={80} />
          <LoadingCard height={80} />
        </Column>
      ) : (
        <Column>
          {v1Shares &&
            Array.from(v1Shares).map(tokenAddress => {
              return <PoolUnit token={tokenAddress} key={tokenAddress} />
            })}
          {v2Shares &&
            Array.from(v2Shares).map(tokenAddress => {
              return <PoolUnit token={tokenAddress} key={tokenAddress} alreadyMigrated={true} />
            })}
        </Column>
      )}
    </Column>
  )
}

export default withRouter(Migrate)
