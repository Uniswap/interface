import { Pair } from '@uniswap/v2-sdk'
import { Currency } from '@uniswap/sdk-core'
import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { darken } from 'polished'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { TYPE } from '../../theme'
import { Input as NumericalInput } from '../NumericalInput'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { useActiveWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'
import useTheme from '../../hooks/useTheme'
import { Lock } from 'react-feather'
import { AutoColumn } from 'components/Column'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '12px' : '20px')};
  background-color: ${({ theme }) => theme.bg2};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.bg1};
  opacity: 0.95;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '12px' : '20px')};
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  :focus,
  :hover {
    border: 1px solid ${({ theme }) => theme.bg3};
  }
`

const CurrencySelect = styled.button<{ selected: boolean; hideInput?: boolean }>`
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.bg2 : theme.primary1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 12px;
  /* box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')}; */
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);

  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;

  height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.4rem')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};

  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg3 : darken(0.05, theme.primary1))};
  }
`

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '.75rem 0.75rem .75rem 1rem' : '.75rem 0.75rem .75rem 1rem')};
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0rem 1rem 0.75rem 1rem;
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

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.5rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '18px')};
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: ${({ theme }) => theme.primary5};
  border: 1px solid ${({ theme }) => theme.primary5};
  border-radius: 0.5rem;
  font-size: 14px;

  font-weight: 500;
  cursor: pointer;
  /* margin-left: 0.5rem; */
  color: ${({ theme }) => theme.primary1};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};

  :hover {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
    outline: none;
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
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
  locked?: boolean
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label = 'Input',
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  ...rest
}: CurrencyInputPanelProps) {
  const { t } = useTranslation()

  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const disableCurrencySelect = typeof onCurrencySelect !== 'function'

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <TYPE.label fontSize="12px">Single-asset deposit only, price out of range.</TYPE.label>
          </AutoColumn>
        </FixedContainer>
      )}
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow style={{ padding: ' 1rem 1rem 0rem 1rem' }}>
            <RowBetween>
              <TYPE.body color={theme.text3} fontWeight={500} fontSize={14}>
                {label}
              </TYPE.body>
            </RowBetween>
          </LabelRow>
        )}
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
          <CurrencySelect
            selected={!!currency}
            hideInput={hideInput}
            className="open-currency-select-button"
            onClick={() => {
              if (!disableCurrencySelect) {
                setModalOpen(true)
              }
            }}
          >
            <Aligner>
              <RowFixed>
                {pair ? (
                  <span style={{ marginRight: '0.5rem' }}>
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  </span>
                ) : currency ? (
                  <CurrencyLogo style={{ marginRight: '0.5rem' }} currency={currency} size={'24px'} />
                ) : null}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
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
              </RowFixed>
              {!disableCurrencySelect && <StyledDropDown selected={!!currency} />}
            </Aligner>
          </CurrencySelect>
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
            </>
          )}
        </InputRow>
        {!hideInput && !hideBalance && (
          <LabelRow>
            <RowBetween>
              {account && (
                <RowFixed>
                  <TYPE.body
                    onClick={onMax}
                    color={theme.text3}
                    fontWeight={500}
                    fontSize={14}
                    style={{ display: 'inline', cursor: 'pointer' }}
                  >
                    {!hideBalance && !!currency && selectedCurrencyBalance
                      ? (customBalanceText ?? 'Balance: ') +
                        selectedCurrencyBalance?.toSignificant(4) +
                        ' ' +
                        currency.symbol
                      : ' '}
                  </TYPE.body>
                </RowFixed>
              )}
              {showMaxButton && (
                <StyledBalanceMax disabled={!showMaxButton} onClick={onMax}>
                  Max
                </StyledBalanceMax>
              )}
            </RowBetween>
          </LabelRow>
        )}
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
