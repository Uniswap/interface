import { InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { ReactComponent as DropDown } from 'assets/images/dropdown.svg'
import { ButtonGray } from 'components/Button'
import { FiatValue } from 'components/CurrencyInputPanel/FiatValue'
import { DoubleCurrencyLogo } from 'components/DoubleLogo'
import { LoadingOpacityContainer, loadingOpacityMixin } from 'components/Loader/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { Input as NumericalInput } from 'components/NumericalInput'
import { RowBetween, RowFixed } from 'components/Row'
import { CurrencySearchFilters } from 'components/SearchModal/CurrencySearch'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useIsSupportedChainId } from 'constants/chains'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/TokenBalancesProvider'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { darken } from 'polished'
import { ReactNode, useCallback, useState } from 'react'
import { useCurrencyBalance } from 'state/connection/hooks'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.surface2)};

  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
`

const Container = styled.div<{ hideInput: boolean; disabled: boolean }>`
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  border: 1px solid ${({ theme }) => theme.surface3};
  background-color: ${({ theme }) => theme.surface2};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  ${({ theme, hideInput, disabled }) =>
    !disabled &&
    `
    :focus,
    :hover {
      border: 1px solid ${hideInput ? ' transparent' : theme.surface2};
    }
  `}
`

const CurrencySelect = styled(ButtonGray)<{
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
  pointerEvents?: string
}>`
  align-items: center;
  background-color: ${({ selected, theme }) => (selected ? theme.surface1 : theme.accent1)};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  box-shadow: ${({ theme }) => theme.deprecated_shallowShadow};
  color: ${({ selected, theme }) => (selected ? theme.neutral1 : theme.white)};
  cursor: pointer;
  border-radius: 16px;
  outline: none;
  user-select: none;
  border: none;
  font-size: 24px;
  font-weight: 535;
  height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.4rem')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: 0 8px;
  justify-content: space-between;
  margin-left: ${({ hideInput }) => (hideInput ? '0' : '12px')};
  :focus,
  :hover {
    background-color: ${({ selected, theme }) => (selected ? theme.surface2 : darken(0.05, theme.accent1))};
  }
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  ${({ pointerEvents }) => pointerEvents && `pointer-events: none`}
`

const InputRow = styled.div<{ selected: boolean }>`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
  padding: ${({ selected }) => (selected ? ' 1rem 1rem 0.75rem 1rem' : '1rem 1rem 1rem 1rem')};
`

const LabelRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.neutral1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 1rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.neutral2)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
  padding: 0px 1rem 0.75rem;
  height: 32px;
`

// note the line height 0 ensures even if we change font/font-size it doesn't break centering
const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  line-height: 0px;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.neutral1 : theme.white)};
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: 20px;
  white-space: nowrap;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    font-size: 16px;
  }
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  background-color: ${({ theme }) => theme.accent2};
  border: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.accent1};
  cursor: pointer;
  font-size: 11px;
  font-weight: 535;
  margin-left: 0.25rem;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  padding: 4px 6px;
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};

  :hover {
    opacity: ${({ disabled }) => (!disabled ? 0.8 : 0.4)};
  }

  :focus {
    outline: none;
  }
`

const StyledNumericalInput = styled(NumericalInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  text-align: left;
`

const StyledPrefetchBalancesWrapper = styled(PrefetchBalancesWrapper)<{ $fullWidth: boolean }>`
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: { data?: number; isLoading: boolean }
  id: string
  showCurrencyAmount?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
  currencySearchFilters?: CurrencySearchFilters
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  currencySearchFilters,
  showCurrencyAmount,
  renderBalance,
  fiatValue,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  loading = false,
  ...rest
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const account = useAccount()
  const chainAllowed = useIsSupportedChainId(account.chainId)
  const selectedCurrencyBalance = useCurrencyBalance(account.address, currency ?? undefined)
  const theme = useTheme()
  const { formatCurrencyAmount } = useFormatter()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {!locked && (
        <>
          <Container hideInput={hideInput} disabled={!chainAllowed}>
            <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={!onCurrencySelect}>
              {!hideInput && (
                <StyledNumericalInput
                  className="token-amount-input"
                  value={value}
                  onUserInput={onUserInput}
                  disabled={!chainAllowed}
                  $loading={loading}
                  maxDecimals={currency?.decimals}
                />
              )}

              <StyledPrefetchBalancesWrapper $fullWidth={hideInput}>
                <CurrencySelect
                  disabled={!chainAllowed}
                  visible={currency !== undefined}
                  selected={!!currency}
                  hideInput={hideInput}
                  className="open-currency-select-button"
                  onClick={() => {
                    if (onCurrencySelect) {
                      setModalOpen(true)
                    }
                  }}
                  pointerEvents={!onCurrencySelect ? 'none' : undefined}
                >
                  <Aligner>
                    <RowFixed>
                      {pair ? (
                        <span style={{ marginRight: '0.5rem' }}>
                          <DoubleCurrencyLogo currencies={[pair.token0, pair.token1]} size={24} />
                        </span>
                      ) : (
                        currency && <CurrencyLogo style={{ marginRight: '0.5rem' }} currency={currency} size={24} />
                      )}
                      {pair ? (
                        <StyledTokenName className="pair-name-container">
                          {pair?.token0.symbol}:{pair?.token1.symbol}
                        </StyledTokenName>
                      ) : (
                        <StyledTokenName
                          className="token-symbol-container"
                          active={Boolean(currency && currency.symbol)}
                        >
                          {(currency && currency.symbol && currency.symbol.length > 20
                            ? currency.symbol.slice(0, 4) +
                              '...' +
                              currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                            : currency?.symbol) || <Trans i18nKey="common.selectToken" />}
                        </StyledTokenName>
                      )}
                    </RowFixed>
                    {onCurrencySelect && <StyledDropDown selected={!!currency} />}
                  </Aligner>
                </CurrencySelect>
              </StyledPrefetchBalancesWrapper>
            </InputRow>
            {Boolean(!hideInput && !hideBalance && currency) && (
              <FiatRow>
                <RowBetween>
                  <LoadingOpacityContainer $loading={loading}>
                    {fiatValue && <FiatValue fiatValue={fiatValue} />}
                  </LoadingOpacityContainer>
                  {account && (
                    <RowFixed style={{ height: '17px' }}>
                      <ThemedText.DeprecatedBody
                        onClick={onMax}
                        color={theme.neutral3}
                        fontWeight={535}
                        fontSize={14}
                        style={{ display: 'inline', cursor: 'pointer' }}
                      >
                        {Boolean(!hideBalance && currency && selectedCurrencyBalance) &&
                          (renderBalance?.(selectedCurrencyBalance as CurrencyAmount<Currency>) || (
                            <Trans
                              i18nKey="swap.balance.amount"
                              values={{
                                amount: formatCurrencyAmount({
                                  amount: selectedCurrencyBalance,
                                  type: NumberType.TokenNonTx,
                                }),
                              }}
                            />
                          ))}
                      </ThemedText.DeprecatedBody>
                      {Boolean(showMaxButton && selectedCurrencyBalance) && (
                        <Trace
                          logPress
                          eventOnTrigger={SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED}
                          element={InterfaceElementName.MAX_TOKEN_AMOUNT_BUTTON}
                        >
                          <StyledBalanceMax onClick={onMax}>
                            <Trans i18nKey="common.max.caps" />
                          </StyledBalanceMax>
                        </Trace>
                      )}
                    </RowFixed>
                  )}
                </RowBetween>
              </FiatRow>
            )}
          </Container>
        </>
      )}
      {onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          showCurrencyAmount={showCurrencyAmount}
          currencySearchFilters={currencySearchFilters}
        />
      )}
    </InputPanel>
  )
}
