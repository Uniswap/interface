import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId, TokenAmount } from '@ubeswap/sdk'
import Loader from 'components/Loader'
import React from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import { useCUSDPrice } from 'utils/useCUSDPrice'

import tokenLogo from '../../assets/images/token-logo.png'
import { UBE } from '../../constants'
import { useTotalSupply } from '../../data/TotalSupply'
import { useTotalUbeEarned } from '../../state/stake/hooks'
import { useAggregateUbeBalance, useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, StyledInternalLink, TYPE, UbeTokenAnimated } from '../../theme'
import { AutoColumn } from '../Column'
import { Break, CardNoise, CardSection, DataCard } from '../earn/styled'
import { RowBetween } from '../Row'
import { useCirculatingSupply } from './useCirculatingSupply'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, ${({ theme }) => theme.primary1} 0%, #021d43 100%), #edeef2;
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function UbeBalanceContent({ setShowUbeBalanceModal }: { setShowUbeBalanceModal: any }) {
  const { address: account, network } = useContractKit()
  const chainId = network.chainId
  const ube = chainId ? UBE[chainId] : undefined

  const total = useAggregateUbeBalance()
  const ubeBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, ube)
  const ubeToClaim: TokenAmount | undefined = useTotalUbeEarned()

  const totalSupply: TokenAmount | undefined = useTotalSupply(ube)
  const ubePrice = useCUSDPrice(ube)
  const circulation = useCirculatingSupply()

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Your UBE Breakdown</TYPE.white>
            <StyledClose stroke="white" onClick={() => setShowUbeBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UbeTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.white fontSize={48} fontWeight={600} color="white">
                  {total?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.white>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">Balance:</TYPE.white>
                  <TYPE.white color="white">{ubeBalance?.toFixed(2, { groupSeparator: ',' })}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white color="white">Unclaimed:</TYPE.white>
                  <TYPE.white color="white">
                    {ubeToClaim?.toFixed(4, { groupSeparator: ',' })}{' '}
                    {ubeToClaim && ubeToClaim.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowUbeBalanceModal(false)} to="/farm">
                        (claim)
                      </StyledInternalLink>
                    )}
                  </TYPE.white>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.white color="white">UBE price:</TYPE.white>
              <TYPE.white color="white">${ubePrice?.toFixed(2) ?? '-'}</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white color="white">UBE in circulation:</TYPE.white>
              <TYPE.white color="white">{circulation?.toFixed(0, { groupSeparator: ',' }) ?? <Loader />}</TYPE.white>
            </RowBetween>
            <RowBetween>
              <TYPE.white color="white">Total Supply</TYPE.white>
              <TYPE.white color="white">{totalSupply?.toFixed(0, { groupSeparator: ',' }) ?? <Loader />}</TYPE.white>
            </RowBetween>
            {ube && ube.chainId === ChainId.MAINNET ? (
              <ExternalLink href={`https://info.ubeswap.org/token/${ube.address}`}>View UBE Analytics</ExternalLink>
            ) : null}
          </AutoColumn>
        </CardSection>
        <CardNoise />
      </ModalUpper>
    </ContentWrapper>
  )
}
