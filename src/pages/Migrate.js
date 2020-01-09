import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'

import { useAllBalances } from '../contexts/Balances'
import { useAllTokenDetails } from '../contexts/Tokens'
import { useWeb3React } from '../hooks'

import Card from '../components/CardStyled'
import LoaderLight from '../components/Loader'
import PoolUnit from '../components/PoolUnit'

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
    margin-top: 1rem;
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
`

const bounceIn = keyframes`
  from {
    transform: translateZ(0) scale(0);
  }
  to{
    transform: translateZ(0) scale(1);
  }
`
const AnimatedUnit = styled.div`
  /* animation: ${bounceIn} 0.4s 0s cubic-bezier(0.175, 0.885, 0.32, 1.075) forwards; */
`

function Migrate() {
  const { account } = useWeb3React()

  const allBalances = useAllBalances()

  const allTokenDetails = useAllTokenDetails()

  const [userLPTokens, setUserLPTokens] = useState()

  // get V1 LP balances
  useEffect(() => {
    if (Object.keys(allTokenDetails).length > 0 && allBalances && Object.keys(allBalances).length > 0) {
      let newUserLPTokens = []
      Object.keys(allTokenDetails).map(tokenAddress => {
        let hasPooltokens = false
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
            hasPooltokens = true
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
            hasPooltokens = true
          }
        }
        if (hasPooltokens) {
          newUserLPTokens.push(tokenAddress)
        }
        return true
      })
      setUserLPTokens(newUserLPTokens)
    }
  }, [account, allBalances, allTokenDetails])

  const fetching = !(allBalances && allBalances[account])

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
            userLPTokens && userLPTokens.length + ' pools found'
          )}
        </SubText>
      </Row>
      {fetching ? (
        <Column>
          <LoadingCard height={80} />
          <LoadingCard height={80} />
          <LoadingCard height={80} />
        </Column>
      ) : (
        <Column>
          {userLPTokens &&
            userLPTokens.map(token => (
              <AnimatedUnit key={token}>
                <PoolUnit token={token} />
              </AnimatedUnit>
            ))}
        </Column>
      )}
    </Wrapper>
  )
}

export default withRouter(Migrate)
