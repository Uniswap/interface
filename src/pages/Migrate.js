import React, { useEffect, useState } from 'react'
import { withRouter } from 'react-router'
import styled, { keyframes } from 'styled-components'
import { darken } from 'polished'

import { useAllBalances } from '../contexts/Balances'
import { useAllTokenDetails, useTokenDetails } from '../contexts/Tokens'
import { useWeb3React } from '../hooks'
import { useWalletModalToggle } from '../contexts/Application'

import Card from '../components/CardStyled'
import LoaderLight from '../components/Loader'
import TextBlock from '../components/Text'
import PoolUnit from '../components/PoolUnit'
import { WETH } from '@uniswap/sdk-v2'
import { X } from 'react-feather'

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 1rem 0;
`

const RowStart = styled(Row)`
  justify-content: flex-start;
  height: fit-content;
  padding: 0;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
`

const shine = keyframes`
   from { background-position: 100%}
    to {background-position: -100%}
`

const CloseIcon = styled(X)`
  position: absolute;
  cursor: pointer;
  top: 1rem;
  right: 1rem;
  color: ${({ theme }) => theme.colors.primaryText1};
`

const InfoCard = styled(Card)`
  color: ${({ theme }) => theme.colors.primaryText1};
  border: 1px solid ${({ theme }) => theme.colors.primary5};
  background-color: transparent;
  position: relative;
`

const Link = styled.a`
  color: ${({ theme, color }) => (color ? theme.colors[color] : theme.colors.primary2)};
  font-weight: 500;
`

const LoadingCard = styled(Card)`
  background-image: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.bg2} 0px,
    ${({ theme }) => darken(0.03, theme.colors.bg2)} 20%,
    ${({ theme }) => theme.colors.bg2} 50%
  );
  background-size: 200%;
  animation: ${shine} 1.2s infinite linear;
  margin-top: 10px;
`

const PlaceholderCard = styled(Card)`
  background-color: ${({ theme }) => theme.colors.bg2};
  margin-top: 10px;
`

const Input = styled.input`
  border-radius: 20px;
  font-size: 16px;
  border: 1px solid ${({ theme }) => theme.colors.bg3};
  color: ${({ theme }) => theme.colors.text1};
  background-color: ${({ theme }) => theme.colors.bg1};
  padding: 20px 10px;
  outline: none;
  -webkit-appearance: none;
  margin-bottom: 12px;
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

  const toggleWalletModal = useWalletModalToggle()
  const [showHelperCard, setShowHelperCard] = useState(true)

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
      {typeof account !== 'string' && showHelperCard ? (
        <InfoCard style={{ marginTop: '0' }}>
          <RowStart>
            <TextBlock color={'primaryText1'} style={{ fontWeight: '500', fontSize: '24px' }}>
              Uniswap V2 Migration
            </TextBlock>
          </RowStart>
          <RowStart style={{ marginTop: '1rem' }}>
            {/* <Power size={18} style={{ marginRight: '.5rem' }} /> */}
            <TextBlock
              onClick={toggleWalletModal}
              color={'primaryText1'}
              style={{ fontWeight: '500', fontSize: '16px', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Connect an Ethereum wallet to get started
            </TextBlock>
          </RowStart>
          <TextBlock color={'primaryText1'} padding={'1rem 0 0 0'}>
            This tool is for liquidity providers wishing to migrate liquidity from Uniswap V1 pools into Uniswap V2.{' '}
            <Link color={'primaryText1'} href="https://uniswap.exchange">
              Click here
            </Link>{' '}
            for the full Uniswap V2 interface.
          </TextBlock>
          <Link style={{ marginTop: '1rem', display: 'inline-block' }} href="https://uniswap.org/blog/uniswap-v2/">
            Read more about Uniswap V2
          </Link>
        </InfoCard>
      ) : (
        <InfoCard style={{ marginTop: '0', display: showHelperCard ? 'inline-block' : 'none' }}>
          <CloseIcon onClick={() => setShowHelperCard(false)} />
          <RowStart>
            {/* <Info style={{ marginRight: '.5rem' }} /> */}
            <div style={{ fontWeight: '500', fontSize: '24px' }}>Uniswap V2 Migration Info</div>
          </RowStart>
          <TextBlock padding={'1rem 0 0 0'} style={{ lineHeight: '140%' }}>
            For each pool, approve the migration helper and click migrate liquidity. Your liquidity will be withdrawn
            from Uniswap V1 and deposited into Uniswap V2. Once you've completed the migration you can view your
            liquidity on the new <Link href="https://uniswap.exchange">Uniswap V2 interface</Link>.
          </TextBlock>
          <TextBlock padding={'1rem 0 0 0'} style={{ lineHeight: '140%' }}>
            If your liquidity does not appear below automatically, you may need to find it by pasting the token address
            into the search box below.
          </TextBlock>
          <Link style={{ marginTop: '1rem', display: 'inline-block' }} href="https://uniswap.org/blog/uniswap-v2/">
            Read more about Uniswap V2.
          </Link>
        </InfoCard>
      )}
      <Row>
        <TextBlock fontSize={24} fontWeight={500} color={typeof account !== 'string' ? 'text4' : 'text1'}>
          Your Uniswap V1 Liquidity
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
        <>
          <Column>
            <PlaceholderCard height={80} />
            <PlaceholderCard height={80} />
            <PlaceholderCard height={80} />
          </Column>
        </>
      ) : (
        <>
          {/* <TextBlock padding={'1rem 0'}>Dont see your liquidity? Enter a token address here.</TextBlock> */}
          <Input
            onChange={e => {
              setUserInput(e.target.value)
            }}
            placeholder="Dont see your liquidity? Enter a token address here."
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

              <Row>
                <TextBlock fontSize={24} fontWeight={500} color={[...V2Shares].length > 0 ? 'text1' : 'text4'}>
                  Your Uniswap V2 Liquidity
                </TextBlock>
                {[...V2Shares].length > 0 && <Link href="https://v2.uniswap.exchange/pool">Manage V2 Liquidity</Link>}
              </Row>

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
