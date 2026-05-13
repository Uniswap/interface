import type { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import type { Pair } from '@uniswap/v2-sdk'
import ms from 'ms'
import type { ReactNode } from 'react'
import { forwardRef, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { PrefetchBalancesWrapper } from '~/appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { LoadingOpacityContainer } from '~/components/Loader/styled'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { StyledNumericalInput } from '~/components/NumericalInput'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { MouseoverTooltip } from '~/components/Tooltip'
import { FiatValue } from '~/features/Swap/CurrencyInputPanel/FiatValue'
import { formatCurrencySymbol } from '~/features/Swap/CurrencyInputPanel/utils'
import { useSwapAndLimitContext } from '~/features/Swap/state/swap/useSwapContext'
import { useAccount } from '~/hooks/useAccount'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { useCurrencyBalance } from '~/state/connection/hooks'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import { SwitchNetworkAction } from '~/state/popups/types'
import { flexColumnNoWrap, flexRowNoWrap } from '~/theme/styles'

export const InputPanel = deprecatedStyled.div<{ hideInput?: boolean }>`
  ${flexColumnNoWrap};
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
`

const FixedContainer = deprecatedStyled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = deprecatedStyled.div<{ hideInput: boolean }>`
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

const CurrencySelect = deprecatedStyled.button<CurrencySelectProps>`
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

const InputRow = deprecatedStyled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
`

const LabelRow = deprecatedStyled.div`
  ${flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  font-size: 12px;
  line-height: 1rem;
`

const FiatRow = deprecatedStyled(LabelRow)`
  justify-content: flex-end;
  min-height: 24px;
  padding: 8px 0px 0px 0px;
`

const Aligner = deprecatedStyled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const CurrencySelectChevron = deprecatedStyled.span`
  margin: 0 0.25rem 0 0.35rem;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledTokenName = deprecatedStyled.span<{ active?: boolean }>`
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
  chainIds?: UniverseChainId[]
  switchNetworkAction?: SwitchNetworkAction
}

export const SwapCurrencyInputPanel = forwardRef<HTMLInputElement, SwapCurrencyInputPanelProps>(
  // oxlint-disable-next-line complexity
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
      chainIds,
      switchNetworkAction,
      ...rest
    },
    ref,
  ) => {
    const [modalOpen, setModalOpen] = useState(false)
    const account = useAccount()
    const { currentTab } = useSwapAndLimitContext()
    const { chainId, isUserSelectedToken } = useMultichainContext()
    const chainAllowed = useIsSupportedChainId(chainId)
    const selectedCurrencyBalance = useCurrencyBalance(account.address, currency ?? undefined)
    const { formatCurrencyAmount } = useLocalizationContext()
    const { t } = useTranslation()

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
    useEffect(() => setTooltipVisible(false), [currency])

    const showCurrencyLoadingSpinner =
      initialCurrencyLoading && !otherCurrency && !isUserSelectedToken && currencyField === CurrencyField.INPUT

    const isInputDisabled = Boolean(!chainAllowed || disabled || numericalInputSettings?.disabled)

    return (
      <InputPanel id={id} hideInput={hideInput} {...rest}>
        {locked && (
          <FixedContainer>
            <Flex gap="$gap8" alignItems="center" width="100%">
              <Lock color="$neutral2" size="$icon.24" />
              <Text variant="body2" textAlign="center" px="$spacing12">
                {t('swap.marketPrice.outsideRange.label')}
              </Text>
            </Flex>
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
                    <Flex row position="relative" width="fit-content">
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
                              {currency ? formatCurrencySymbol(currency) : t('tokens.selector.button.choose')}
                            </StyledTokenName>
                          )}
                        </Flex>
                      </AnimatePresence>
                    </Flex>
                    {onCurrencySelect && (
                      <CurrencySelectChevron>
                        <RotatableChevron direction="down" size="$icon.16" color={currency ? '$neutral1' : '$white'} />
                      </CurrencySelectChevron>
                    )}
                  </Aligner>
                </CurrencySelect>
              </MouseoverTooltip>
            </PrefetchBalancesWrapper>
          </InputRow>
          {Boolean(!hideInput && !hideBalance) && (
            <FiatRow>
              <Flex row width="100%" justifyContent="space-between" alignItems="center">
                <LoadingOpacityContainer $loading={loading}>
                  {fiatValue && (
                    <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} testId={`fiat-value-${id}`} />
                  )}
                </LoadingOpacityContainer>
                {!initialCurrencyLoading ? (
                  <Flex row position="relative" width="fit-content" height={16}>
                    <Text variant="body3" color="$neutral2" data-testid="balance-text" display="inline">
                      {!hideBalance && currency && selectedCurrencyBalance
                        ? renderBalance
                          ? renderBalance(selectedCurrencyBalance)
                          : t('swap.balance.amount', {
                              amount: formatCurrencyAmount({
                                value: selectedCurrencyBalance,
                                type: NumberType.TokenNonTx,
                              }),
                            })
                        : null}
                    </Text>
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
                  </Flex>
                ) : (
                  <span />
                )}
              </Flex>
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
            chainIds={chainIds}
            switchNetworkAction={switchNetworkAction ?? SwitchNetworkAction.Swap}
            swapTab={currentTab}
          />
        )}
      </InputPanel>
    )
  },
)
SwapCurrencyInputPanel.displayName = 'SwapCurrencyInputPanel'
