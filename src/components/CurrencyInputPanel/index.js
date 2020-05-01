import React, { useState } from 'react'
import styled from 'styled-components'
import '@reach/tooltip/styles.css'
import { darken } from 'polished'

import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import SearchModal from '../SearchModal'
import { RowBetween } from '../Row'
import { TYPE, Hover } from '../../theme'
import { Input as NumericalInput } from '../NumericalInput'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'

import { useWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'
import { useAddressBalance } from '../../contexts/Balances'

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.75rem 0.5rem 0.75rem 1rem;
`

const CurrencySelect = styled.button`
  align-items: center;
  height: 2.2rem;
  font-size: 20px;
  font-family: 'Inter';
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.bg1 : theme.blue1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 12px;
  box-shadow: ${({ selected, theme }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  /* padding: 0px; */
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;

  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg2 : darken(0.05, theme.blue1))};
  }
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 1.25rem 1rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const ErrorSpan = styled.span`
  color: ${({ error, theme }) => error && theme.red1};
  :hover {
    cursor: pointer;
    color: ${({ error, theme }) => error && darken(0.1, theme.red1)};
  }
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledDropDown = styled(DropDown)`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.bg2};
  z-index: 1;
`

const Container = styled.div`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

const StyledTokenName = styled.span`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.75rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '16px')};

`

const StyledBalanceMax = styled.button`
  height: 35px;
  background-color: ${({ theme }) => theme.blue5};
  border: 1px solid ${({ theme }) => theme.blue5};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.blue1};
  :hover {
    border: 1px solid ${({ theme }) => theme.blue1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.blue1};
    outline: none;
  }
`

export default function CurrencyInputPanel({
  value,
  field,
  onUserInput,
  onMax,
  atMax,
  error,
  type = '',
  urlAddedTokens = [], // used
  onTokenSelection = null,
  token = null,
  disableTokenSelect = false,
  hideBalance = false,
  isExchange = false,
  pair = null, // used for double token logo
  hideInput = false,
  showSendWithSwap = false,
  otherSelectedTokenAddress = null
}) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useWeb3React()
  const userTokenBalance = useAddressBalance(account, token)

  return (
    <InputPanel>
      <Container error={!!error} hideInput={hideInput}>
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} hideInput={hideInput}>
          {!hideInput && (
            <>
              <NumericalInput
                value={value}
                onUserInput={val => {
                  onUserInput(field, val)
                }}
              />
              {!!token?.address && !atMax && type !== 'OUTPUT' && (
                <StyledBalanceMax onClick={onMax}>MAX</StyledBalanceMax>
              )}
            </>
          )}
          <CurrencySelect
            selected={!!token}
            onClick={() => {
              if (!disableTokenSelect) {
                setModalOpen(true)
              }
            }}
            disableTokenSelect={disableTokenSelect}
          >
            <Aligner>
              {isExchange ? (
                <DoubleLogo a0={pair?.token0.address} a1={pair?.token1.address} size={24} margin={true} />
              ) : token?.address ? (
                <TokenLogo address={token?.address} size={'24px'} />
              ) : null}
              {isExchange ? (
                <StyledTokenName>
                  {pair?.token0.symbol}:{pair?.token1.symbol}
                </StyledTokenName>
              ) : (
                <StyledTokenName active={token && token.symbol}>
                  {(token && token.symbol) || t('selectToken')}
                </StyledTokenName>
              )}
              {!disableTokenSelect && <StyledDropDown selected={!!token?.address} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>
        {!hideBalance && !!token && (
          <LabelRow>
            <RowBetween>
              <ErrorSpan data-tip={'Enter max'} error={!!error} onClick={() => {}}></ErrorSpan>
              <Hover onClick={onMax}>
                <TYPE.body fontWeight={500}>Balance: {userTokenBalance?.toSignificant(6)}</TYPE.body>
              </Hover>
            </RowBetween>
          </LabelRow>
        )}
      </Container>
      {!disableTokenSelect && (
        <SearchModal
          isOpen={modalOpen}
          onDismiss={() => {
            setModalOpen(false)
          }}
          filterType="tokens"
          urlAddedTokens={urlAddedTokens}
          field={field}
          onTokenSelect={onTokenSelection}
          showSendWithSwap={showSendWithSwap}
          hiddenToken={token?.address}
          otherSelectedTokenAddress={otherSelectedTokenAddress}
          otherSelectedText={field === 0 ? ' Selected as output' : 'Selected as input'}
        />
      )}
    </InputPanel>
  )
}
