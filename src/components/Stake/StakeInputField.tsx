import { ChainId, useContractKit } from '@celo-tools/use-contractkit'
import { Token, TokenAmount } from '@ubeswap/sdk'
import { darken } from 'polished'
import React from 'react'
import styled from 'styled-components'

import { useCurrencyBalance } from '../../state/wallet/hooks'
import { Input as NumericalInput } from '../NumericalInput'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.bg2};
  z-index: 1;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

const StyledControlButton = styled.button`
  height: 28px;
  background-color: ${({ theme }) => theme.primary5};
  border: 1px solid ${({ theme }) => theme.primary5};
  border-radius: 0.5rem;
  font-size: 0.875rem;

  font-weight: 500;
  cursor: pointer;
  margin-left: 0.3rem;
  margin-right: 0.2rem;
  color: ${({ theme }) => theme.primaryText1};
  :hover {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-left: 0.4rem;
    margin-right: 0.1rem;
  `};
`

const AmountWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
`

const AmountDescriptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: unset;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
`};
`
const ButtonGroup = styled.div``

interface StakeInputFieldProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  currency?: Token | null
  hideBalance?: boolean
  hideInput?: boolean
  id: string
  chainId?: ChainId
  stakeBalance?: TokenAmount
  walletBalance?: TokenAmount
}

export default function StakeInputField({
  value,
  onUserInput,
  onMax,
  currency,
  hideBalance = false,
  hideInput = false,
  id,
  stakeBalance,
  walletBalance,
}: StakeInputFieldProps) {
  const { address: account } = useContractKit()

  const userBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const selectedCurrencyBalance = walletBalance ?? userBalance

  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            <AmountWrapper>
              {account && (
                <>
                  <AmountDescriptionWrapper>
                    <span>Current Stake:&nbsp;</span>
                    <span>{stakeBalance ? stakeBalance.toFixed(2, { groupSeparator: ',' }) : '--'}</span>
                  </AmountDescriptionWrapper>
                  <AmountDescriptionWrapper>
                    <span>Wallet Balance:&nbsp; </span>
                    <span>
                      {!hideBalance && !!currency && selectedCurrencyBalance
                        ? selectedCurrencyBalance?.toSignificant(4)
                        : '--'}
                    </span>
                  </AmountDescriptionWrapper>
                </>
              )}
            </AmountWrapper>
          </LabelRow>
        )}
        <InputRow style={{ marginTop: '-0.5rem' }} selected={true}>
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              <ButtonGroup>
                <StyledControlButton onClick={onMax}>MAX</StyledControlButton>
              </ButtonGroup>
            </>
          )}
        </InputRow>
      </Container>
    </InputPanel>
  )
}
