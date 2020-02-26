import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { darken } from 'polished'
import '@reach/tooltip/styles.css'

import { Text } from 'rebass'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import TokenLogo from '../TokenLogo'
import SearchModal from '../SearchModal'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween } from '../Row'

import { useWeb3React } from '../../hooks'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'
import { useToken, useAllTokens } from '../../contexts/Tokens'
import { useTokenContract } from '../../hooks'
import { calculateGasMargin } from '../../utils'
import { useAddressBalance } from '../../contexts/Balances'

const GAS_MARGIN = ethers.utils.bigNumberify(1000)

const SubCurrencySelect = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  padding: 4px 50px 4px 15px;
  margin-right: -40px;
  line-height: 0;
  height: 2rem;
  align-items: center;
  border-radius: 2.5rem;
  outline: none;
  cursor: pointer;
  user-select: none;
  background: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.royalBlue};
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;

  padding: 0.25rem 0.85rem 0.75rem;
`

const CurrencySelect = styled.button`
  align-items: center;
  font-size: 20px;
  background-color: ${({ selected, theme }) => (selected ? theme.buttonBackgroundPlain : theme.zumthorBlue)};
  color: ${({ selected, theme }) => (selected ? theme.textColor : theme.royalBlue)};
  height: 2rem;
  border: 1px solid
    ${({ selected, theme, disableTokenSelect }) =>
      disableTokenSelect ? theme.buttonBackgroundPlain : selected ? theme.buttonOutlinePlain : theme.royalBlue};
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  user-select: none;

  :hover {
    border: 1px solid
      ${({ selected, theme }) => (selected ? darken(0.1, theme.outlineGrey) : darken(0.1, theme.royalBlue))};
  }

  :focus {
    border: 1px solid ${({ theme }) => darken(0.1, theme.royalBlue)};
  }

  :active {
    background-color: ${({ theme }) => theme.zumthorBlue};
  }
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledDropDown = styled(DropDown)`
  margin: 0 0.5rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.textColor : theme.royalBlue)};
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.inputBackground};
  z-index: 1;
`

const Container = styled.div`
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.salmonRed : theme.mercuryGray)};

  background-color: ${({ theme }) => theme.inputBackground};
  :focus-within {
    border: 1px solid ${({ error, theme }) => (error ? theme.salmonRed : theme.malibuBlue)};
  }
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.doveGray)};
  }
`

const ErrorSpan = styled.span`
  color: ${({ error, theme }) => error && theme.salmonRed};
  :hover {
    cursor: pointer;
    color: ${({ error, theme }) => error && darken(0.1, theme.salmonRed)};
  }
`

const StyledTokenName = styled.span`
  margin: 0 0.25rem 0 0.75rem;
`

const ClickableText = styled.div`
  :hover {
    cursor: pointer;
  }
`

const StyledBalanceMax = styled.button`
  height: 30px;
  background-color: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.zumthorBlue};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.royalBlue};
  :hover {
    border: 1px solid ${({ theme }) => theme.royalBlue};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.royalBlue};
    outline: none;
  }
`

export default function CurrencyInputPanel({
  value,
  field,
  onUserInput,
  selectedTokenAddress,
  onTokenSelection,
  title,
  onMax,
  atMax,
  error

  // disableUnlock,
  // disableTokenSelect,
  // urlAddedTokens
}) {
  const { account } = useWeb3React()
  const { t } = useTranslation()

  const disableUnlock = false

  const disableTokenSelect = false

  const urlAddedTokens = []

  const errorMessage = error

  const [modalIsOpen, setModalIsOpen] = useState(false)

  const tokenContract = useTokenContract(selectedTokenAddress)
  const { exchangeAddress: selectedTokenExchangeAddress } = useToken(selectedTokenAddress)

  const pendingApproval = usePendingApproval(selectedTokenAddress)

  const addTransaction = useTransactionAdder()

  const allTokens = useAllTokens()

  const token = useToken(selectedTokenAddress)

  const userTokenBalance = useAddressBalance(account, token)

  const [showUnlock] = useState(false)

  const [showMax, setShowMax] = useState(false)

  function renderUnlockButton() {
    if (disableUnlock || !showUnlock || selectedTokenAddress === 'ETH' || !selectedTokenAddress) {
      return null
    } else {
      if (!pendingApproval) {
        return (
          <SubCurrencySelect
            onClick={async () => {
              let estimatedGas
              let useUserBalance = false
              estimatedGas = await tokenContract.estimate
                .approve(selectedTokenExchangeAddress, ethers.constants.MaxUint256)
                .catch(e => {
                  console.log('Error setting max token approval.')
                })
              if (!estimatedGas) {
                // general fallback for tokens who restrict approval amounts
                estimatedGas = await tokenContract.estimate.approve(selectedTokenExchangeAddress, userTokenBalance)
                useUserBalance = true
              }
              tokenContract
                .approve(
                  selectedTokenExchangeAddress,
                  useUserBalance ? userTokenBalance : ethers.constants.MaxUint256,
                  {
                    gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                  }
                )
                .then(response => {
                  addTransaction(response, { approval: selectedTokenAddress })
                })
            }}
          >
            {t('unlock')}
          </SubCurrencySelect>
        )
      } else {
        return <SubCurrencySelect>{t('pending')}</SubCurrencySelect>
      }
    }
  }

  return (
    <InputPanel>
      <Container error={!!errorMessage}>
        <LabelRow>
          <RowBetween>
            <Text>{title}</Text>
            <ErrorSpan data-tip={'Enter max'} error={!!errorMessage} onClick={() => {}}></ErrorSpan>
            <ClickableText onClick={onMax}>
              <Text>Balance: {userTokenBalance?.toFixed(2)}</Text>
            </ClickableText>
          </RowBetween>
        </LabelRow>
        <InputRow>
          <NumericalInput
            field={field}
            value={value}
            onUserInput={onUserInput}
            onFocus={() => {
              setShowMax(true)
            }}
          />
          {!!selectedTokenAddress && !atMax && showMax && <StyledBalanceMax onClick={onMax}>MAX</StyledBalanceMax>}
          {renderUnlockButton()}
          <CurrencySelect
            selected={!!selectedTokenAddress}
            onClick={() => {
              if (!disableTokenSelect) {
                setModalIsOpen(true)
              }
            }}
            disableTokenSelect={disableTokenSelect}
          >
            <Aligner>
              {selectedTokenAddress ? <TokenLogo address={selectedTokenAddress} size={'24px'} /> : null}
              {
                <StyledTokenName>
                  {(allTokens[selectedTokenAddress] && allTokens[selectedTokenAddress].symbol) || t('selectToken')}
                </StyledTokenName>
              }
              {!disableTokenSelect && <StyledDropDown selected={!!selectedTokenAddress} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>
      </Container>
      {!disableTokenSelect && (
        <SearchModal
          isOpen={modalIsOpen}
          onDismiss={() => {
            setModalIsOpen(false)
          }}
          filterType="tokens"
          urlAddedTokens={urlAddedTokens}
          field={field}
          onTokenSelect={onTokenSelection}
        />
      )}
    </InputPanel>
  )
}
