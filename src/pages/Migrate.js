import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'

import { useAllBalances } from '../contexts/Balances'
import { useAllTokenDetails, useTokenDetails } from '../contexts/Tokens'
import { useWeb3React } from '../hooks'

import Card from '../components/CardStyled'
import LoaderLight from '../components/Loader'
import TextBlock from '../components/Text'
import PoolUnit from '../components/PoolUnit'
import { WETH } from '@uniswap/sdk-v2'

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
  margin-top: 10px;
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
  const { chainId, account } = useWeb3React()

  const allTokenDetails = useAllTokenDetails()
  const allBalances = useAllBalances()

  const [V1Shares, setV1Shares] = useState(new Set())
  const [V2Shares, setV2Shares] = useState(new Set())

  const [userInput, setUserInput] = useState()
  useTokenDetails(userInput)

  const poolAmount = new Set([...V1Shares, ...V2Shares]).size
  const [finishedFetching, setFinishedFetching] = useState(false)

  useEffect(() => {
    if (allTokenDetails && allBalances) {
      let newV1Shares = new Set()
      let newV2Shares = new Set()
      let finishedFetching = true
      Object.keys(allTokenDetails)
        .filter(tokenAddress => tokenAddress !== 'ETH')
        .forEach(tokenAddress => {
          let exchangeAddress = allTokenDetails[tokenAddress].exchangeAddress
          let exchangeAddressV2 = allTokenDetails[tokenAddress].exchangeAddressV2
          // get v1 LP shares
          if (
            exchangeAddress &&
            allBalances[account] &&
            allBalances[account][exchangeAddress] &&
            (allBalances[account][exchangeAddress].value || allBalances[account][exchangeAddress].value === null)
          ) {
            if (
              allBalances[account][exchangeAddress].value !== null &&
              !allBalances[account][exchangeAddress].value.isZero()
            ) {
              newV1Shares.add(tokenAddress)
            }
          } else {
            finishedFetching = false
          }
          // get v2 LP shares
          if (
            exchangeAddressV2 &&
            allBalances[account] &&
            allBalances[account][exchangeAddressV2] &&
            (allBalances[account][exchangeAddressV2].value || allBalances[account][exchangeAddressV2].value === null)
          ) {
            if (
              allBalances[account][exchangeAddressV2].value !== null &&
              !allBalances[account][exchangeAddressV2].value.isZero()
            ) {
              newV2Shares.add(tokenAddress)
            }
          } else {
            // this guard is for WETH, whose exchange address v2 is null, which is not an error
            if (exchangeAddressV2) {
              finishedFetching = false
            }
          }
        })
      setV1Shares(V1Shares => new Set([...V1Shares, ...newV1Shares]))
      setV2Shares(newV2Shares)
      setFinishedFetching(finishedFetching)
    }
  }, [account, chainId, allTokenDetails, allBalances])

  return (
    <Column>
      <Row>
        <TextBlock fontSize={24} fontWeight={500}>
          Your Liquidity
        </TextBlock>
        <TextBlock fontSize={16} color={'grey3'}>
          {typeof account !== 'string' ? null : !finishedFetching ? (
            <Row>
              Fetching liquidity <LoaderLight style={{ marginLeft: '10px' }} />
            </Row>
          ) : (
            poolAmount + ` pool${poolAmount === 1 ? '' : 's'} found`
          )}
        </TextBlock>
      </Row>

      {typeof account !== 'string' ? (
        <TextBlock fontSize={16}>Please connect a Wallet to view your liquidity.</TextBlock>
      ) : (
        <>
          <TextBlock padding={'1rem 0'}>Dont see your liquidity? Enter a token address here.</TextBlock>
          <Input
            onChange={e => {
              setUserInput(e.target.value)
            }}
            placeholder="Search token address"
            style={{ paddingLeft: '1.25rem' }}
          />
          {!finishedFetching ? (
            <Column>
              <LoadingCard height={80} />
              <LoadingCard height={80} />
              <LoadingCard height={80} />
            </Column>
          ) : (
            <Column>
              {V1Shares &&
                [...V1Shares]
                  // ensure that WETH is first if it exists
                  .sort((a, b) => {
                    if (a === WETH[chainId].address) {
                      return -1
                    } else if (b === WETH[chainId].address) {
                      return 1
                    } else {
                      return 0
                    }
                  })
                  .map(tokenAddress => {
                    return (
                      <PoolUnit
                        token={tokenAddress}
                        key={tokenAddress}
                        isWETH={tokenAddress === WETH[chainId].address}
                      />
                    )
                  })}

              <TextBlock fontSize="1.25rem" mt="2rem">
                Migrated Liquidity
              </TextBlock>

              {V2Shares &&
                [...V2Shares].map(tokenAddress => {
                  return <PoolUnit token={tokenAddress} key={tokenAddress} alreadyMigrated={true} />
                })}
            </Column>
          )}
        </>
      )}
    </Column>
  )
}

export default withRouter(Migrate)
