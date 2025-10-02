import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import type { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import type { Pair } from '@uniswap/v2-sdk'
import { ReactComponent as DropDown } from 'assets/images/dropdown.svg'
import { FiatValue } from 'components/CurrencyInputPanel/FiatValue'
import { formatCurrencySymbol } from 'components/CurrencyInputPanel/utils'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween, RowFixed } from 'components/deprecated/Row'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { StyledNumericalInput } from 'components/NumericalInput'
import { SwitchNetworkAction } from 'components/Popups/types'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { MouseoverTooltip } from 'components/Tooltip'
import { useAccount } from 'hooks/useAccount'
import styled, { useTheme } from 'lib/styled-components'
import ms from 'ms'
import type { ReactNode } from 'react'
import { forwardRef, useCallback, useEffect, useState } from 'react'
import { Lock } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useCurrencyBalance } from 'state/connection/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import { AnimatePresence, Button, Flex, Text } from 'ui/src'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

export const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
`

const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = styled.div<{ hideInput: boolean }>`
  min-height: 44px;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

interface CurrencySelectProps {
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
  animateShake?: boolean
}

const CurrencySelect = styled.button<CurrencySelectProps>`
  align-items: center;
  background-color: ${({ selected, theme }) => (selected ? theme.surface1 : theme.accent1)};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  color: ${({ selected, theme }) => (selected ? theme.neutral1 : theme.neutralContrast)};
  cursor: pointer;
  height: 36px;
  border-radius: 18px;
  outline: none;
  user-select: none;
  border: 1px solid ${({ selected, theme }) => (selected ? theme.surface3 : theme.accent1)};
  font-size: 16px;
  font-weight: 485;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: ${({ selected }) => (selected ? '4px 8px 4px 4px' : '6px 6px 6px 8px')};
  gap: 8px;
  justify-content: space-between;
  margin-left: ${({ hideInput }) => (hideInput ? '0' : '12px')};
  box-shadow: ${({ theme }) => theme.deprecated_shallowShadow};

  &:hover,
  &:active {
    background-color: ${({ theme, selected }) => (selected ? theme.surface1Hovered : theme.accent1Hovered)};
  }

  &:before {
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    content: '';
  }

  ${({ hideInput, theme }) =>
    hideInput &&
    `
      &:hover:before {
        background-color: ${theme.deprecated_stateOverlayHover};
      }

      &:active:before {
        background-color: ${theme.deprecated_stateOverlayPressed};
      }
    `}

  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};

  @keyframes horizontal-shaking {
    0% {
      transform: translateX(0);
      animation-timing-function: ease-in-out;
    }
    20% {
      transform: translateX(10px);
      animation-timing-function: ease-in-out;
    }
    40% {
      transform: translateX(-10px);
      animation-timing-function: ease-in-out;
    }
    60% {
      transform: translateX(10px);
      animation-timing-function: ease-in-out;
    }
    80% {
      transform: translateX(-10px);
      animation-timing-function: ease-in-out;
    }
    100% {
      transform: translateX(0);
      animation-timing-function: ease-in-out;
    }
  }
  animation: ${({ animateShake }) => (animateShake ? 'horizontal-shaking 300ms' : 'none')};
`

const InputRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
`

const LabelRow = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  font-size: 12px;
  line-height: 1rem;
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
  min-height: 24px;
  padding: 8px 0px 0px 0px;
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
  margin-left: 8px;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.neutral1 : theme.neutralContrast)};
    stroke-width: 2px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size: 16px;
  font-weight: 535;
`

interface SwapCurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  currencyField: CurrencyField
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: { data?: number; isLoading: boolean }
  priceImpact?: Percent
  id: string
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  locked?: boolean
  loading?: boolean
  disabled?: boolean
  numericalInputSettings?: {
    disabled?: boolean
    onDisabledClick?: () => void
    disabledTooltipBody?: ReactNode
  }
  initialCurrencyLoading?: boolean
}

const SwapCurrencyInputPanel = forwardRef<HTMLInputElement, SwapCurrencyInputPanelProps>(
  (
    {
      value,
      onUserInput,
      onMax,
      showMaxButton,
      onCurrencySelect,
      currency,
      otherCurrency,
      id,
      renderBalance,
      fiatValue,
      priceImpact,
      hideBalance = false,
      pair = null, // used for double token logo
      hideInput = false,
      locked = false,
      loading = false,
      disabled = false,
      initialCurrencyLoading = false,
      currencyField,
      numericalInputSettings,
      label,
      ...rest
    },
    ref,
  ) => {
    const [modalOpen, setModalOpen] = useState(false)
    const account = useAccount()
    const { chainId, isUserSelectedToken } = useMultichainContext()
    const chainAllowed = useIsSupportedChainId(chainId)
    const selectedCurrencyBalance = useCurrencyBalance(account.address, currency ?? undefined)
    const theme = useTheme()
    const { formatCurrencyAmount } = useLocalizationContext()
    const { t } = useTranslation()

    // biome-ignore lint/correctness/useExhaustiveDependencies: +setModalOpen
    const handleDismissSearch = useCallback(() => {
      setModalOpen(false)
    }, [setModalOpen])

    const [tooltipVisible, setTooltipVisible] = useState(false)
    const handleDisabledNumericalInputClick = useCallback(() => {
      if (numericalInputSettings?.disabled && !tooltipVisible) {
        setTooltipVisible(true)
        setTimeout(() => setTooltipVisible(false), ms('4s')) // reset shake animation state after 4s
        numericalInputSettings.onDisabledClick?.()
      }
    }, [tooltipVisible, numericalInputSettings])

    // reset tooltip state when currency changes
    // biome-ignore lint/correctness/useExhaustiveDependencies: currency dependency is sufficient for this effect
    useEffect(() => setTooltipVisible(false), [currency])

    const showCurrencyLoadingSpinner =
      initialCurrencyLoading && !otherCurrency && !isUserSelectedToken && currencyField === CurrencyField.INPUT

    const isInputDisabled = Boolean(!chainAllowed || disabled || numericalInputSettings?.disabled)

    return (
      <InputPanel id={id} hideInput={hideInput} {...rest}>
        {locked && (
          <FixedContainer>
            <AutoColumn gap="sm" justify="center">
              <Lock />
              <Text variant="body2" textAlign="center" px="$spacing12">
                <Trans i18nKey="swap.marketPrice.outsideRange.label" />
              </Text>
            </AutoColumn>
          </FixedContainer>
        )}

        <Container hideInput={hideInput}>
          <Text variant="body3" userSelect="none" color="$neutral2">
            {label}
          </Text>
          <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}}>
            {!hideInput && (
              <Flex fill onPress={handleDisabledNumericalInputClick}>
                <StyledNumericalInput
                  className="token-amount-input"
                  value={value}
                  onUserInput={onUserInput}
                  disabled={isInputDisabled}
                  $loading={loading}
                  id={id}
                  ref={ref}
                  maxDecimals={currency?.decimals}
                  style={{ width: '100%' }}
                />
              </Flex>
            )}
            <PrefetchBalancesWrapper>
              <MouseoverTooltip
                disabled
                forceShow={tooltipVisible && !modalOpen}
                placement="bottom"
                offsetY={14}
                text={numericalInputSettings?.disabledTooltipBody}
              >
                <CurrencySelect
                  disabled={!chainAllowed || disabled || showCurrencyLoadingSpinner}
                  visible={currency !== undefined}
                  selected={!!currency}
                  hideInput={hideInput}
                  data-testid={`currency-${currency?.chainId}-${currency?.symbol}`}
                  className="open-currency-select-button"
                  onClick={() => {
                    if (onCurrencySelect) {
                      setModalOpen(true)
                    }
                  }}
                  animateShake={tooltipVisible}
                >
                  <Aligner>
                    <RowFixed>
                      <AnimatePresence>
                        <Flex
                          row
                          alignItems="center"
                          animation="300ms"
                          exitStyle={{ opacity: 0 }}
                          enterStyle={{ opacity: 0 }}
                        >
                          {pair ? (
                            <span style={{ marginRight: '6px' }}>
                              <DoubleCurrencyLogo currencies={[pair.token0, pair.token1]} size={24} />
                            </span>
                          ) : currency ? (
                            <CurrencyLogo
                              style={{ marginRight: '6px' }}
                              currency={currency}
                              size={24}
                              loading={showCurrencyLoadingSpinner}
                            />
                          ) : null}
                          {pair ? (
                            <StyledTokenName className="pair-name-container">
                              {pair.token0.symbol}:{pair.token1.symbol}
                            </StyledTokenName>
                          ) : (
                            <StyledTokenName
                              className="token-symbol-container"
                              active={Boolean(currency && currency.symbol)}
                            >
                              {currency ? (
                                formatCurrencySymbol(currency)
                              ) : (
                                <Trans i18nKey="tokens.selector.button.choose" />
                              )}
                            </StyledTokenName>
                          )}
                        </Flex>
                      </AnimatePresence>
                    </RowFixed>
                    {onCurrencySelect && <StyledDropDown selected={!!currency} />}
                  </Aligner>
                </CurrencySelect>
              </MouseoverTooltip>
            </PrefetchBalancesWrapper>
          </InputRow>
          {Boolean(!hideInput && !hideBalance) && (
            <FiatRow>
              <RowBetween>
                <LoadingOpacityContainer $loading={loading}>
                  {fiatValue && (
                    <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} testId={`fiat-value-${id}`} />
                  )}
                </LoadingOpacityContainer>
                {!initialCurrencyLoading ? (
                  <RowFixed style={{ height: '16px' }}>
                    <ThemedText.DeprecatedBody
                      data-testid="balance-text"
                      color={theme.neutral2}
                      fontWeight={485}
                      fontSize={14}
                      style={{ display: 'inline' }}
                    >
                      {!hideBalance && currency && selectedCurrencyBalance ? (
                        renderBalance ? (
                          renderBalance(selectedCurrencyBalance)
                        ) : (
                          <Trans
                            i18nKey="swap.balance.amount"
                            values={{
                              amount: formatCurrencyAmount({
                                value: selectedCurrencyBalance,
                                type: NumberType.TokenNonTx,
                              }),
                            }}
                          />
                        )
                      ) : null}
                    </ThemedText.DeprecatedBody>
                    {showMaxButton && selectedCurrencyBalance ? (
                      <Trace logPress element={ElementName.MaxTokenAmountButton}>
                        <Button
                          alignSelf="center"
                          variant="branded"
                          pr="$spacing6"
                          pl="$spacing12"
                          emphasis="text-only"
                          size="small"
                          isDisabled={disabled}
                          onPress={onMax}
                        >
                          {t('swap.button.max')}
                        </Button>
                      </Trace>
                    ) : null}
                  </RowFixed>
                ) : (
                  <span />
                )}
              </RowBetween>
            </FiatRow>
          )}
        </Container>
        {onCurrencySelect && (
          <CurrencySearchModal
            currencyField={currencyField}
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={otherCurrency}
            switchNetworkAction={SwitchNetworkAction.Swap}
          />
        )}
      </InputPanel>
    )
  },
)
SwapCurrencyInputPanel.displayName = 'SwapCurrencyInputPanel'

export default SwapCurrencyInputPanel
