import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { AutoColumn } from 'components/Column'
import { LoadingOpacityContainer, loadingOpacityMixin } from 'components/Loader/styled'
import TradePrice from 'components/swap/TradePrice'
import { darken } from 'polished'
import { Fragment, ReactNode, useCallback, useEffect, useState } from 'react'
import { Lock, Minus, Plus } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { CommonQuantity } from 'types/main'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import useTheme from '../../hooks/useTheme'
import { useActiveWeb3React } from '../../hooks/web3'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { ButtonGray } from '../Button'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween, RowFixed } from '../Row'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { FiatValue } from './FiatValue'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.bg2)};
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
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  border: 2px solid ${({ theme, hideInput }) => (hideInput ? ' transparent' : theme.bg2)};
  background-color: ${({ theme }) => theme.bg6};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};

  :focus,
  :hover {
    border: 2px solid ${({ theme, hideInput }) => (hideInput ? ' transparent' : theme.bg3)};
  }
`

const CurrencySelect = styled(ButtonGray)<{ visible: boolean; selected: boolean; hideInput?: boolean }>`
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  align-items: center;
  font-size: 24px;
  font-weight: 500;
  background-color: ${({ selected, theme }) => (selected ? theme.bg1 : theme.primary1)};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  border-radius: 16px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.4rem')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: 0 8px;
  justify-content: space-between;
  margin-right: ${({ hideInput }) => (hideInput ? '0' : '12px')};

  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.bg2 : darken(0.05, theme.primary1))};
  }
`

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 1rem 1rem;

  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: ${({ active }) => (active ? '18px' : '18px')};
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  color: ${({ theme }) => theme.primaryText1};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};
  margin-left: 0.25rem;

  :focus {
    outline: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin-right: 0.5rem;
  `};
`

const StyledNumericalInput = styled(NumericalInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin}
`

const StyledButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
`

const SmallButton = styled(ButtonGray)`
  background-color: ${({ theme }) => theme.primary1};
  border-radius: 4px;
  padding: 0;
  width: 20px;
  height: 20px;

  :hover {
    background-color: ${({ theme }) => darken(0.05, theme.primary1)};
  }
`

const ButtonLabel = styled(TYPE.white)<{ disabled: boolean }>`
  color: ${({ theme, disabled }) => (disabled ? theme.text2 : theme.white)} !important;
  display: flex;
  justify-content: center;
  align-items: center;
`

const ActionLabel = styled(Text)`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.text2};
  padding: 10px 16px 0;
`

const StyledCommonQuantityButton = styled(ButtonGray)`
  font-size: 14px;
  cursor: pointer;
  width: 25%;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bg1};
  padding: 4px;
  text-align: center;
  :focus,
  :hover {
    background-color: ${({ theme }) => theme.bg2};
  }
`

interface CurrencyInputPanelProps {
  currencySearchTitle?: string
  value: string
  decrement?: () => string
  increment?: () => string
  decrementDisabled?: boolean
  incrementDisabled?: boolean
  onUserInput: (value: string) => void
  onCommonQuantity?: (commonQuantity: CommonQuantity) => void
  showCommonQuantityButtons: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: CurrencyAmount<Token> | null
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
  showCurrencySelector?: boolean
  showRate?: boolean
  isInvertedRate?: boolean
  price?: Price<Currency, Currency> | undefined
  actionLabel?: string
}

export default function CurrencyInputPanel({
  currencySearchTitle = 'Select a token',
  value,
  onUserInput,
  onCommonQuantity,
  showCommonQuantityButtons,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  renderBalance,
  fiatValue,
  priceImpact,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  loading = false,
  showCurrencySelector = true,
  showRate = false,
  isInvertedRate = false,
  price,
  actionLabel,
  ...rest
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const [showInverted, setShowInverted] = useState<boolean>(isInvertedRate)

  const [localValue, setLocalValue] = useState('0')

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const calculateChange = (increment?: boolean) => {
    const numValue = Number(localValue)
    const step = numValue / 100
    return increment ? (numValue + step).toFixed(8) : (numValue - step).toFixed(8)
  }

  const handleIncrement = () => {
    const newValue = calculateChange(true)
    onUserInput(newValue)
    setLocalValue(newValue)
  }

  const handleDecrement = () => {
    const newValue = calculateChange()
    onUserInput(newValue)
    setLocalValue(newValue)
  }

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <TYPE.label fontSize={16} textAlign="center" padding="0 12px">
              <Trans>The market price is outside your specified price range. Single-asset deposit only.</Trans>
            </TYPE.label>
          </AutoColumn>
        </FixedContainer>
      )}
      <Container hideInput={hideInput}>
        {actionLabel && (
          <div className="" style={{ display: 'flex' }}>
            <ActionLabel style={{ width: '50%' }}>
              <Trans>{actionLabel}</Trans>
            </ActionLabel>
            {showCommonQuantityButtons && selectedCurrencyBalance && onCommonQuantity && (
              <ActionLabel
                style={{
                  width: '100%',
                  justifyContent: 'end',
                  display: 'flex',
                  gap: '10px',
                  color: 'white',
                }}
              >
                <>
                  <StyledCommonQuantityButton onClick={() => onCommonQuantity('25%' as CommonQuantity)}>
                    25%
                  </StyledCommonQuantityButton>
                  <StyledCommonQuantityButton onClick={() => onCommonQuantity('50%' as CommonQuantity)}>
                    50%
                  </StyledCommonQuantityButton>
                  <StyledCommonQuantityButton onClick={() => onCommonQuantity('75%' as CommonQuantity)}>
                    75%
                  </StyledCommonQuantityButton>
                  <StyledCommonQuantityButton onClick={() => onCommonQuantity('100%' as CommonQuantity)}>
                    100%
                  </StyledCommonQuantityButton>
                </>
              </ActionLabel>
            )}
          </div>
        )}
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={!onCurrencySelect}>
          {showCurrencySelector ? (
            <CurrencySelect
              visible={currency !== undefined}
              selected={!!currency}
              hideInput={hideInput}
              className="open-currency-select-button"
              onClick={() => {
                if (onCurrencySelect) {
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
                        : currency?.symbol) || <Trans>Select a token</Trans>}
                    </StyledTokenName>
                  )}
                </RowFixed>
                {onCurrencySelect && <StyledDropDown selected={!!currency} />}
              </Aligner>
            </CurrencySelect>
          ) : null}
          {showRate && (
            <RowFixed style={{ height: '17px', marginRight: '12px' }}>
              <TYPE.main>
                <Trans>Limit Price</Trans>
              </TYPE.main>
            </RowFixed>
          )}
          {!hideInput && (
            <Fragment>
              <StyledNumericalInput
                className="token-amount-input"
                value={localValue}
                onUserInput={onUserInput}
                $loading={loading}
              />
              {showRate && value && price && (
                <StyledButtonGroup>
                  <SmallButton onClick={handleIncrement} disabled={false}>
                    <ButtonLabel disabled={false} fontSize="12px">
                      <Plus size={18} />
                    </ButtonLabel>
                  </SmallButton>
                  <SmallButton onClick={handleDecrement} disabled={false}>
                    <ButtonLabel disabled={false} fontSize="12px">
                      <Minus size={18} />
                    </ButtonLabel>
                  </SmallButton>
                </StyledButtonGroup>
              )}
            </Fragment>
          )}
        </InputRow>
        {!hideInput && !hideBalance && !showRate && (
          <FiatRow>
            <RowBetween>
              {account ? (
                <RowFixed style={{ height: '17px' }}>
                  <TYPE.body color={theme.text2} fontWeight={400} fontSize={14} style={{ display: 'inline' }}>
                    {!hideBalance && currency && selectedCurrencyBalance ? (
                      renderBalance ? (
                        renderBalance(selectedCurrencyBalance)
                      ) : (
                        <Trans>
                          Balance: {formatCurrencyAmount(selectedCurrencyBalance, 4)} {currency.symbol}
                        </Trans>
                      )
                    ) : null}
                  </TYPE.body>
                </RowFixed>
              ) : (
                <FiatRow />
              )}
              <LoadingOpacityContainer $loading={loading}>
                <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
              </LoadingOpacityContainer>
            </RowBetween>
          </FiatRow>
        )}

        {showRate && value && price && (
          <Fragment>
            <FiatRow>
              <RowBetween>
                <TradePrice price={price} showInverted={showInverted} setShowInverted={setShowInverted} />
              </RowBetween>
            </FiatRow>
          </Fragment>
        )}
      </Container>
      {onCurrencySelect && (
        <CurrencySearchModal
          title={currencySearchTitle}
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCommonBases={showCommonBases}
          showCurrencyAmount={showCurrencyAmount}
          disableNonToken={disableNonToken}
        />
      )}
    </InputPanel>
  )
}
