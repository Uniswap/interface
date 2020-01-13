import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'

import { useAllBalances } from '../contexts/Balances'
import { useAllTokenDetails, useTokenDetails } from '../contexts/Tokens'
import { useWeb3React } from '../hooks'

import Card from '../components/CardStyled'
import LoaderLight from '../components/Loader'
import PoolUnit from '../components/PoolUnit3'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const HeaderText = styled.div`
  font-size: 24px;
  font-weight: 500;
`

const SubText = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.grey3};
`

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
  & > div {
    /* margin-top: 20px; */
  }
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

const InputHeader = styled.span`
  font-weight: 500;
  padding: 1rem 0;
`

const Input = styled.input`
  border-radius: 10px;
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

  const [userLPTokens, setUserLPTokens] = useState()

  const [poolAmount, setPoolAmount] = useState()

  const [userInput, setUserInput] = useState()

  useTokenDetails(userInput)

  // get V1 LP balances
  useEffect(() => {
    if (Object.keys(allTokenDetails).length > 0 && allBalances && Object.keys(allBalances).length > 0) {
      let newUserLPTokens = []
      let poolsFound = 0
      Object.keys(allTokenDetails).map(tokenAddress => {
        let exchangeAddress = allTokenDetails[tokenAddress].exchangeAddress
        let exchangeAddressV2 = allTokenDetails[tokenAddress].exchangeAddressV2
        // get v1 LP shares
        if (
          allBalances &&
          allBalances[account] &&
          allBalances[account][exchangeAddress] &&
          allBalances[account][exchangeAddress].value
        ) {
          const balanceBigNumber = ethers.utils.bigNumberify(allBalances[account][exchangeAddress].value)
          if (!balanceBigNumber.isZero()) {
            poolsFound++
          }
        }
        // get v2 LP shares
        if (
          allBalances &&
          allBalances[account] &&
          allBalances[account][exchangeAddressV2] &&
          allBalances[account][exchangeAddressV2].value
        ) {
          const balanceBigNumber = ethers.utils.bigNumberify(allBalances[account][exchangeAddressV2].value)
          if (!balanceBigNumber.isZero()) {
            poolsFound++
          }
        }
        if (poolsFound > 0) {
          newUserLPTokens.push(tokenAddress)
        }
        return true
      })
      setUserLPTokens(newUserLPTokens)
      setPoolAmount(poolsFound)
    }
  }, [account, allBalances, allTokenDetails])

  const [fetching, setFetching] = useState()

  useEffect(() => {
    setFetching(!(allBalances && allBalances[account]))
  }, [allBalances, account, allTokenDetails])

  return (
    <Wrapper>
      <Row>
        <HeaderText>Your Liquidity</HeaderText>
        <SubText>
          {fetching ? (
            <Row>
              Fetching balances <LoaderLight style={{ marginLeft: '10px' }} />
            </Row>
          ) : (
            poolAmount + ' pools found'
          )}
        </SubText>
      </Row>
      <InputHeader>Dont see your liquidity ? Enter a token address here.</InputHeader>
      <Input
        onChange={e => {
          setUserInput(e.target.value)
        }}
        placeholder={'Search token address'}
        value={userInput}
      />
      {fetching ? (
        <Column>
          <LoadingCard height={80} />
          <LoadingCard height={80} />
          <LoadingCard height={80} />
        </Column>
      ) : (
        <Column>{userLPTokens && userLPTokens.map(token => <PoolUnit token={token} key={token} />)}</Column>
      )}
    </Wrapper>
  )
}

export default withRouter(Migrate)
