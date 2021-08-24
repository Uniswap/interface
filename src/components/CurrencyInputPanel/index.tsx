import { Currency, CurrencyAmount, Pair } from '@swapr/sdk'
import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import NumericalInput from '../Input/NumericalInput'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'

import { useActiveWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
`

const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  font-size: ${({ selected }) => (selected ? '26px' : '12px')};
  font-weight: ${({ selected }) => (selected ? 600 : 700)};
  background-color: ${({ selected, theme }) => (selected ? 'transparent' : theme.primary1)};
  border-radius: 8px;
  height: 28px;
  padding: ${({ selected }) => (selected ? '0' : '0 12px')};
  color: ${({ theme }) => theme.white};
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  margin-bottom: 8px;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0 0 5px;
  height: 11px;
  width: 11px;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  z-index: 1;
`

const Container = styled.div<{ focused: boolean }>`
  height: 80px;
  background-color: ${({ theme }) => theme.bg1And2};
  border: solid 1px ${({ focused, theme }) => (focused ? theme.bg3 : theme.bg1And2)};
  border-radius: 12px;
  transition: border 0.3s ease;
  padding: 17px 22px;
`

const Content = styled.div`
  height: 46px;
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  margin: ${({ active }) => (active ? '0 0 0 6px' : '0')};
  font-size: ${({ active }) => (active ? '16px' : '11px')};
  line-height: ${({ active }) => (active ? '20px' : '13px')};
  letter-spacing: 0.08em;
`

const StyledBalanceMax = styled.button`
  font-size: 11px;
  line-height: 13px;
  letter-spacing: 0.08em;
  cursor: pointer;
  margin-right: 4px;
  color: ${({ theme }) => theme.purple3};
  text-decoration: underline;
  outline: none;
  background: transparent;
  border: none;
`

const UppercaseHelper = styled.span`
  text-transform: uppercase;
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
  balance?: CurrencyAmount
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  balance
}: CurrencyInputPanelProps) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

  return (
    <InputPanel id={id}>
      <Container focused={focused}>
        <Content>
          {!hideInput && (
            <LabelRow>
              <RowBetween>
                <TYPE.body fontWeight="600" fontSize="11px" lineHeight="13px" letterSpacing="0.08em">
                  <UppercaseHelper>{label}</UppercaseHelper>
                </TYPE.body>
                {account && (
                  <TYPE.body
                    onClick={onMax}
                    fontWeight="600"
                    fontSize="11px"
                    lineHeight="13px"
                    letterSpacing="0.08em"
                    style={{ display: 'inline', cursor: 'pointer' }}
                  >
                    <UppercaseHelper>
                      {!hideBalance && !!(currency || pair) && (balance || selectedCurrencyBalance)
                        ? (customBalanceText ?? 'Balance: ') + (balance || selectedCurrencyBalance)?.toSignificant(6)
                        : '-'}
                    </UppercaseHelper>
                  </TYPE.body>
                )}
              </RowBetween>
            </LabelRow>
          )}
          <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
            {!hideInput && (
              <>
                <NumericalInput
                  className="token-amount-input"
                  value={value}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onUserInput={val => {
                    onUserInput(val)
                  }}
                />
                {account && (currency || pair) && showMaxButton && label !== 'To' && (
                  <StyledBalanceMax onClick={onMax}>MAX</StyledBalanceMax>
                )}
              </>
            )}
            <CurrencySelect
              selected={!!(currency || pair)}
              className="open-currency-select-button"
              onClick={() => {
                if (!disableCurrencySelect) {
                  setModalOpen(true)
                }
              }}
            >
              <Aligner>
                {pair ? (
                  <DoubleCurrencyLogo marginRight={4} currency0={pair.token0} currency1={pair.token1} size={20} />
                ) : currency ? (
                  <CurrencyLogo currency={currency} size="20px" />
                ) : null}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}/{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                        '...' +
                        currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || t('selectToken')}
                  </StyledTokenName>
                )}
                {!disableCurrencySelect && (pair || currency) && <StyledDropDown selected={!!currency} />}
              </Aligner>
            </CurrencySelect>
          </InputRow>
        </Content>
      </Container>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
        />
      )}
    </InputPanel>
  )
}
