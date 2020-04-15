import React, { useState } from 'react'
import styled from 'styled-components'
import '@reach/tooltip/styles.css'
import { darken } from 'polished'

import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import SearchModal from '../SearchModal'
import { TYPE } from '../../theme'
import { Text } from 'rebass'
import { RowBetween } from '../Row'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { Input as NumericalInput } from '../NumericalInput'

import { useWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'
import { useAddressBalance } from '../../contexts/Balances'

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;

  padding: 0.75rem 0.85rem 0.75rem;
`

const CurrencySelect = styled.button`
  align-items: center;
  height: 2.2rem;
  font-size: 20px;
  background-color: ${({ selected, theme }) => (selected ? theme.bg1 : theme.blue1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  user-select: none;

  border: 1px solid ${({ selected, theme }) => (selected ? darken(0.1, theme.bg3) : darken(0.1, theme.blue1))};

  :focus,
  :hover {
    border: 1px solid ${({ selected, theme }) => (selected ? darken(0.2, theme.bg3) : darken(0.2, theme.blue1))};
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
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.bg1};
  z-index: 1;
`

const Container = styled.div`
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  border: 1px solid ${({ error, theme }) => (error ? theme.red1 : theme.bg2)};
  background-color: ${({ theme }) => theme.bg1};
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text3};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.5rem 1rem 1rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text3)};
  }
`

const ErrorSpan = styled.span`
  color: ${({ error, theme }) => error && theme.red1};
  :hover {
    cursor: pointer;
    color: ${({ error, theme }) => error && darken(0.1, theme.red1)};
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
  urlAddedTokens = [], // used
  onTokenSelection = null,
  token = null,
  disableTokenSelect = false,
  hideBalance = false,
  isExchange = false,
  pair = null, // used for double token logo
  customBalance = null, // used for LP balances instead of token balance
  hideInput = false,
  showSendWithSwap = false
}) {
  const { t } = useTranslation()
  const { account } = useWeb3React()

  const [modalOpen, setModalOpen] = useState(false)

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
              {!!token?.address && !atMax && <StyledBalanceMax onClick={onMax}>MAX</StyledBalanceMax>}
              {/* {renderUnlockButton()} */}
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
                <StyledTokenName>{(token && token.symbol) || t('selectToken')}</StyledTokenName>
              )}
              {!disableTokenSelect && <StyledDropDown selected={!!token?.address} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>
        {!hideBalance && !!token && (
          <LabelRow>
            <RowBetween>
              <Text>{'-'}</Text>
              <ErrorSpan data-tip={'Enter max'} error={!!error} onClick={() => {}}></ErrorSpan>
              <ClickableText onClick={onMax}>
                <TYPE.body>
                  Balance: {customBalance ? customBalance?.toSignificant(4) : userTokenBalance?.toSignificant(4)}
                </TYPE.body>
              </ClickableText>
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
        />
      )}
    </InputPanel>
  )
}
