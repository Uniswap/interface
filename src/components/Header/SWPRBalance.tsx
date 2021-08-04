import { SWPR } from 'dxswap-sdk'
import React from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween } from '../Row'
import { Break, CardSection, DataCard } from '../earn/styled'
import useUnclaimedSWPRBalance from '../../hooks/swpr/useUnclaimedSWPRBalance'
import Skeleton from 'react-loading-skeleton'
import { useTotalSupply } from '../../data/TotalSupply'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #021d43 100%);
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

// TODO: yet to be used
export default function SWPRBalanceContent({ onDismiss }: { onDismiss: () => void }) {
  const { account, chainId } = useActiveWeb3React()
  const swpr = chainId ? SWPR[chainId] : undefined

  const balance = useTokenBalance(account || undefined, swpr)
  const { loading: loadingUnclaimedBalance, unclaimedBalance } = useUnclaimedSWPRBalance(account || undefined)

  const totalSupply = useTotalSupply(swpr)

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
        <CardSection gap="md">
          <RowBetween>
            <TYPE.white color="white">Your SWPR Breakdown</TYPE.white>
            <StyledClose stroke="white" onClick={onDismiss} />
          </RowBetween>
        </CardSection>
        <Break />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white color="white">Balance:</TYPE.white>
                  <TYPE.white color="white">{balance?.toFixed(2)}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white color="white">Unclaimed:</TYPE.white>
                  {loadingUnclaimedBalance || !unclaimedBalance ? (
                    <Skeleton width="40px" height="12px" />
                  ) : (
                    <TYPE.white color="white">
                      {unclaimedBalance.toFixed(4)}{' '}
                      {unclaimedBalance.greaterThan('0') && (
                        <StyledInternalLink onClick={onDismiss} to="/swpr">
                          (claim)
                        </StyledInternalLink>
                      )}
                    </TYPE.white>
                  )}
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <Break />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.white color="white">Total Supply</TYPE.white>
              <TYPE.white color="white">{totalSupply?.toFixed(0, { groupSeparator: ',' })}</TYPE.white>
            </RowBetween>
          </AutoColumn>
        </CardSection>
      </ModalUpper>
    </ContentWrapper>
  )
}
