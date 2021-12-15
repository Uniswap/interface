import { Currency, CurrencyAmount, Pair } from '@dynamic-amm/sdk'
import React, { useState, useContext, useCallback, ReactNode, useEffect } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { darken, lighten } from 'polished'
import { Trans } from '@lingui/macro'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { ReactComponent as SwitchIcon } from '../../assets/svg/switch.svg'
import { useActiveWeb3React } from '../../hooks'
import Card from '../Card'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { Flex, Text } from 'rebass'
import { ButtonEmpty } from 'components/Button'
import Wallet from 'components/Icons/Wallet'

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text : theme.primary)};
    stroke-width: 1.5px;
  }
`

const StyledSwitchIcon = styled(SwitchIcon)<{ selected: boolean }>`
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text : theme.primary)};
    stroke-width: 1.5px;
  }
`

const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 2.125rem;
  font-size: 20px;
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.buttonBlack : theme.buttonBlack)};
  border: 1px solid ${({ theme, selected }) => (selected ? 'transparent' : theme.primary)} !important;
  color: ${({ selected, theme }) => (selected ? theme.text : theme.primary)};
  border-radius: 4px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0.5rem;

  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg2 : darken(0.05, theme.primary))};
    color: ${({ selected, theme }) => (selected ? theme.text : theme.white)};
  }
  :hover ${StyledDropDown}, :focus ${StyledDropDown} {
    path {
      stroke: ${({ selected, theme }) => (selected ? theme.text : theme.white)};
      stroke-width: 1.5px;
    }
  }
`
const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.bg2)};
  z-index: 1;
`

const Container = styled.div<{ selected: boolean; hideInput: boolean }>`
  border-radius: 8px;
  border: 1px solid ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.bg2)};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.buttonBlack)};
  padding: 0.75rem;
`

const StyledTokenName = styled.span<{ active?: boolean; fontSize?: string }>`
  margin: 0 0.375rem 0 0.5rem;
  font-size: ${({ active, fontSize }) => (fontSize ? fontSize : active ? '20px' : '16px')};
`

const StyledBalanceMax = styled.button`
  height: 18px;
  background-color: ${({ theme }) => theme.primary};
  border: 1px solid ${({ theme }) => theme.primary};
  border: none;
  border-radius: 0.125rem;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  color: ${({ theme }) => theme.textReverse};
  :hover {
    background-color: 1px solid ${({ theme }) => lighten(0.1, theme.primary)};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary};
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: 0.5rem;
  `};
`

const Card2 = styled(Card)<{ balancePosition: string }>`
  padding: 0 0.25rem 0.5rem;
  text-align: ${({ balancePosition }) => `${balancePosition}`};
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  positionMax?: 'inline' | 'top'
  label?: string
  onCurrencySelect?: (currency: Currency) => void
  onSwitchCurrency?: () => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  disabledInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
  balancePosition?: string
  hideLogo?: boolean
  fontSize?: string
  customCurrencySelect?: ReactNode
  estimatedUsd?: string
  isSwitchMode?: boolean
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  positionMax = 'inline',
  label = '',
  onCurrencySelect,
  onSwitchCurrency,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  disabledInput = false,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  balancePosition = 'right',
  hideLogo = false,
  fontSize,
  customCurrencySelect,
  estimatedUsd,
  isSwitchMode = false
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { chainId, account } = useActiveWeb3React()

  const [selectedCurrencyBalanceHasValue, setSelectedCurrencyBalanceHasValue] = useState<CurrencyAmount | undefined>(
    undefined
  )

  useEffect(() => {
    setSelectedCurrencyBalanceHasValue(undefined)
  }, [chainId])

  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  useEffect(() => {
    if (!!selectedCurrencyBalance) {
      setSelectedCurrencyBalanceHasValue(selectedCurrencyBalance)
    }
  }, [selectedCurrencyBalance?.toSignificant(20)])

  const theme = useContext(ThemeContext)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <Card2 borderRadius={'20px'} balancePosition={balancePosition}>
          <Flex justifyContent={label ? 'space-between' : 'end'} alignItems="center">
            {label && (
              <Text fontSize={12} color={theme.subText} fontWeight={500}>
                {label}:
              </Text>
            )}
          </Flex>
        </Card2>
      )}
      <InputPanel id={id} hideInput={hideInput}>
        <Container hideInput={hideInput} selected={disableCurrencySelect}>
          {!hideBalance && (
            <Flex justifyContent="space-between" fontSize="12px" marginBottom="8px" alignItems="center">
              {showMaxButton && positionMax === 'top' && currency && account ? (
                <ButtonEmpty padding="0" width="fit-content" onClick={onMax}>
                  <Trans>Select Max</Trans>
                </ButtonEmpty>
              ) : (
                <div />
              )}
              <Flex>
                <Wallet color={theme.subText} />
                <Text fontWeight={500} color={theme.subText} marginLeft="4px">
                  {customBalanceText || selectedCurrencyBalanceHasValue?.toSignificant(10) || 0}
                </Text>
              </Flex>
            </Flex>
          )}
          <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}>
            {!hideInput && (
              <>
                <NumericalInput
                  className="token-amount-input"
                  value={value}
                  disabled={disabledInput}
                  onUserInput={val => {
                    onUserInput(val)
                  }}
                />
                {estimatedUsd ? (
                  <Text fontSize="0.875rem" fontWeight="500" color={theme.subText}>
                    ~{estimatedUsd}
                  </Text>
                ) : (
                  account &&
                  currency &&
                  showMaxButton &&
                  positionMax === 'inline' && (
                    <StyledBalanceMax onClick={onMax}>
                      <Trans>MAX</Trans>
                    </StyledBalanceMax>
                  )
                )}
              </>
            )}
            {customCurrencySelect || (
              <CurrencySelect
                selected={!!currency}
                className="open-currency-select-button"
                onClick={() => {
                  if (!disableCurrencySelect && !isSwitchMode) {
                    setModalOpen(true)
                  } else if (!disableCurrencySelect && isSwitchMode && onSwitchCurrency) {
                    onSwitchCurrency()
                  }
                }}
              >
                <Aligner>
                  {hideLogo ? null : pair ? (
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  ) : currency ? (
                    <CurrencyLogo currency={currency || undefined} size={'24px'} />
                  ) : null}
                  {pair ? (
                    <StyledTokenName className="pair-name-container">
                      {pair?.token0.symbol}:{pair?.token1.symbol}
                    </StyledTokenName>
                  ) : (
                    <StyledTokenName
                      className="token-symbol-container"
                      active={Boolean(currency && currency.symbol)}
                      fontSize={fontSize}
                    >
                      {(nativeCurrency && nativeCurrency.symbol && nativeCurrency.symbol.length > 20
                        ? nativeCurrency.symbol.slice(0, 4) +
                          '...' +
                          nativeCurrency.symbol.slice(nativeCurrency.symbol.length - 5, nativeCurrency.symbol.length)
                        : nativeCurrency?.symbol) || <Trans>Select a token</Trans>}
                    </StyledTokenName>
                  )}
                  {!disableCurrencySelect && !isSwitchMode && <StyledDropDown selected={!!currency} />}
                  {!disableCurrencySelect && isSwitchMode && <StyledSwitchIcon selected={!!currency} />}
                </Aligner>
              </CurrencySelect>
            )}
          </InputRow>
        </Container>
        {!disableCurrencySelect && !isSwitchMode && onCurrencySelect && (
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
    </div>
  )
}
