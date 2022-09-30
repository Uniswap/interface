import { Currency, CurrencyAmount, Pair } from '@teleswap/sdk'
import { ReactComponent as ArrowDown } from 'assets/svg/arrowdown.svg'
import { ReactComponent as TobeSelected } from 'assets/svg/tobeSelected.svg'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { darken } from 'polished'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, BoxProps } from 'rebass'
import styled from 'styled-components'

import { useActiveWeb3React } from '../../hooks'
import useThemedContext from '../../hooks/useThemedContext'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import CurrencyLogo from '../CurrencyLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween } from '../Row'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '1.25rem 1rem 1.25rem 1.5rem' : '1.25rem 1rem')};
`

const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  min-height: fit-content;
  font-weight: 500;
  // background-color: ${({ selected, theme }) => (selected ? theme.bg1 : theme.primary1)};
  // color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  // border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 47px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0.6rem;

  :focus,
  :hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
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

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledTobeSelected = styled(TobeSelected)``

const StyledDropDown = styled(ArrowDown)<{ selected: boolean }>`
  margin: 0;
  height: 35%;

  /* path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  } */
`

const InputPanel = styled(Box)<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  :hover {
    box-shadow: 0 0 0px 2px rgba(57, 225, 186, 0.2);
  }
  border-radius: 1rem; //${({ hideInput }) => (hideInput ? '8px' : '20px')};
  // background-color: ${({ theme }) => theme.bg2};
  z-index: 1;
  // border-radius: .8rem;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 1rem; //${({ hideInput }) => (hideInput ? '8px' : '20px')};
  padding: 0.5rem 0;
  background-color: ${({ theme }) => theme.bgSwapInput};
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.4rem 0 0.3rem;' : '  margin: 0 0.4rem 0 0.3rem;')}
  font-size:  ${({ active }) => (active ? '1rem' : '.85rem')};
  font-family: 'IBM Plex Sans';
`

const StyledBalanceMax = styled.button`
  /* height: 28px; */
  background-color: #39e1ba;
  // border: 1px solid ${({ theme }) => theme.primary5};
  cursor: pointer;
  font-weight: 600;
  padding: 0px 8px;
  opacity: 0.8;
  border-radius: 0.9rem;
  min-width: fit-content;
  width: 2.5rem;
  height: 22px;
  color: black;
  border: unset;
  :hover {
    /* border: 1px solid ${({ theme }) => theme.primary1}; */
    // background-color: ${({ theme }) => theme.primary1Hover};
    opacity: 1;
  }
  :focus {
    /* border: 1px solid ${({ theme }) => theme.primary1}; */
    // background-color: ${({ theme }) => theme.primary1Hover};
    outline: none;
    opacity: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: 0.5rem;
  `};
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
  ...boxProps
}: CurrencyInputPanelProps & BoxProps) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useThemedContext()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <InputPanel id={id} {...boxProps}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            <RowBetween>
              {/* <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                {label}
              </TYPE.body> */}
              <CurrencySelect
                selected={!!currency}
                className="open-currency-select-button"
                onClick={() => {
                  if (!disableCurrencySelect) {
                    setModalOpen(true)
                  }
                }}
              >
                <Aligner>
                  <>
                    {pair ? (
                      <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={22} margin={true} />
                    ) : currency ? (
                      <CurrencyLogo currency={currency} size={'22px'} />
                    ) : (
                      <StyledTobeSelected width={'22px'} height="22px" />
                    )}
                    &nbsp;
                  </>

                  {pair ? (
                    <StyledTokenName className="pair-name-container text-emphasize">
                      {pair?.token0.symbol}:{pair?.token1.symbol}
                    </StyledTokenName>
                  ) : (
                    <StyledTokenName
                      className="token-symbol-container text-emphasize"
                      active={Boolean(currency && currency.symbol)}
                    >
                      {(currency && currency.symbol && currency.symbol.length > 20
                        ? currency.symbol.slice(0, 4) +
                          '...' +
                          currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                        : currency?.symbol) || t('selectToken')}
                    </StyledTokenName>
                  )}
                  {!disableCurrencySelect && <StyledDropDown selected={!!currency} />}
                </Aligner>
              </CurrencySelect>
              {account && (
                <TYPE.body
                  onClick={onMax}
                  color={theme.text2}
                  fontWeight={500}
                  style={{ display: 'inline', cursor: 'pointer', fontSize: '.6rem', textAlign: 'right' }}
                >
                  <span style={{ color: '#6E747B', marginRight: '.1rem' }} className="text-small">
                    Balance:{' '}
                  </span>
                  {!hideBalance && !!currency && selectedCurrencyBalance ? (
                    <span style={{ color: '#ffffff' }} className="text-small">
                      {selectedCurrencyBalance?.toSignificant(6)}
                    </span>
                  ) : (
                    ' -'
                  )}
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
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {account && currency && showMaxButton && label !== 'To' && (
                <StyledBalanceMax className="text-small" onClick={onMax}>
                  Max
                </StyledBalanceMax>
              )}
            </>
          )}
        </InputRow>
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

interface FarmingWithdrawInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  selectedCurrencyBalance?: CurrencyAmount
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
}
/**
 * Customized for Farming withdraw
 */
export function FarmingWithdrawInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  selectedCurrencyBalance,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  ...boxProps
}: FarmingWithdrawInputPanelProps & BoxProps) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const theme = useThemedContext()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <InputPanel id={id} {...boxProps}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            <RowBetween>
              {/* <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                {label}
              </TYPE.body> */}
              <CurrencySelect
                selected={!!currency}
                className="open-currency-select-button"
                onClick={() => {
                  if (!disableCurrencySelect) {
                    setModalOpen(true)
                  }
                }}
              >
                <Aligner>
                  {pair ? (
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  ) : currency ? (
                    <CurrencyLogo currency={currency} size={'24px'} />
                  ) : null}
                  {pair ? (
                    <StyledTokenName className="pair-name-container text-emphasize">
                      {pair?.token0.symbol}:{pair?.token1.symbol}
                    </StyledTokenName>
                  ) : (
                    <StyledTokenName
                      className="token-symbol-container text-emphasize"
                      active={Boolean(currency && currency.symbol)}
                    >
                      {(currency && currency.symbol && currency.symbol.length > 20
                        ? currency.symbol.slice(0, 4) +
                          '...' +
                          currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                        : currency?.symbol) || t('selectToken')}
                    </StyledTokenName>
                  )}
                  {!disableCurrencySelect && <StyledDropDown selected={!!currency} />}
                </Aligner>
              </CurrencySelect>
              {account && (
                <TYPE.body
                  onClick={onMax}
                  color={theme.text2}
                  fontWeight={500}
                  style={{ display: 'inline', cursor: 'pointer', fontSize: '.6rem', textAlign: 'right' }}
                >
                  <span style={{ color: '#6E747B', marginRight: '.1rem' }}>Balance: </span>
                  {!!currency && selectedCurrencyBalance ? (
                    <span style={{ color: '#ffffff' }}>{selectedCurrencyBalance?.toSignificant(6)}</span>
                  ) : (
                    ' -'
                  )}
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
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {account && currency && showMaxButton && label !== 'To' && (
                <StyledBalanceMax className="text-small" onClick={onMax}>
                  Max
                </StyledBalanceMax>
              )}
            </>
          )}
        </InputRow>
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
