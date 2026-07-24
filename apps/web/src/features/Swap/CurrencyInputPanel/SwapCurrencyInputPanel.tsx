import type { Currency } from '@uniswap/sdk-core'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, styled, Text, TouchableArea, useShadowPropsShort } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { SwapCurrencyInput } from '~/components/NumericalInput/NumericalInput'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { formatCurrencySymbol } from '~/features/Swap/CurrencyInputPanel/utils'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useAccount } from '~/hooks/useAccount'
import { useCurrencyBalance } from '~/state/connection/hooks'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import { SwitchNetworkAction } from '~/state/popups/types'

export const InputPanel = styled(Flex, {
  name: 'SwapInputPanel',
  flexWrap: 'nowrap',
  position: 'relative',
  borderRadius: '$rounded20',
  zIndex: 1,
  width: 'initial',
  '$platform-web': {
    transition: 'height 1s ease',
    willChange: 'height',
  },
})

const CurrencySelectButton = styled(TouchableArea, {
  name: 'CurrencySelectButton',
  tag: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '$spacing36',
  borderRadius: '$roundedFull',
  outlineWidth: 0,
  borderWidth: '$spacing1',
  borderStyle: 'solid',
  width: 'fit-content',
  gap: '$spacing8',
  userSelect: 'none',

  disabledStyle: {
    opacity: 0.4,
    pointerEvents: 'none',
  },

  variants: {
    tokenSelected: {
      true: {
        backgroundColor: '$surface1',
        borderColor: '$surface3',
        color: '$neutral1',
        p: '$spacing4',
        pr: '$spacing8',
        hoverStyle: {
          backgroundColor: '$surface1Hovered',
        },
        pressStyle: {
          backgroundColor: '$surface1Hovered',
        },
      },
      false: {
        backgroundColor: '$accent1',
        borderColor: '$accent1',
        color: '$neutralContrast',
        p: '$spacing6',
        pl: '$spacing8',
        hoverStyle: {
          backgroundColor: '$accent1Hovered',
        },
        pressStyle: {
          backgroundColor: '$accent1Hovered',
        },
      },
    },
    selectorVisible: {
      true: {
        visibility: 'visible',
      },
      false: {
        visibility: 'hidden',
      },
    },
  },

  defaultVariants: {
    tokenSelected: false,
    selectorVisible: true,
  },
})

interface SwapCurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  currencyField: CurrencyField
  otherCurrency?: Currency | null
  id: string
  chainIds?: UniverseChainId[]
  switchNetworkAction?: SwitchNetworkAction
}

export function SwapCurrencyInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  currencyField,
  label,
  chainIds,
  switchNetworkAction,
}: SwapCurrencyInputPanelProps): JSX.Element {
  const { value: modalOpen, setTrue: openModal, setFalse: closeModal } = useBooleanState(false)
  const shadowPropsShort = useShadowPropsShort()
  const account = useAccount()
  const { currentTab } = useSwapAndLimitContext()
  const { chainId } = useMultichainContext()
  const chainAllowed = useIsSupportedChainId(chainId)
  const selectedCurrencyBalance = useCurrencyBalance(account.address, currency ?? undefined)
  const { formatCurrencyAmount } = useLocalizationContext()
  const { t } = useTranslation()

  const isInputDisabled = !chainAllowed

  return (
    <InputPanel id={id}>
      <Flex minHeight="$spacing44" borderRadius="$rounded20" width="initial">
        <Text variant="body3" userSelect="none" color="$neutral2">
          {label}
        </Text>
        <Flex row flexWrap="nowrap" alignItems="center" justifyContent="space-between" mt="$spacing4">
          <Flex fill minWidth={0}>
            <SwapCurrencyInput
              className="token-amount-input"
              testId={currencyField === CurrencyField.INPUT ? TestID.AmountInputIn : TestID.AmountInputOut}
              value={value}
              onUserInput={onUserInput}
              disabled={isInputDisabled}
              id={id}
              maxDecimals={currency?.decimals}
              width="100%"
            />
          </Flex>
          <Flex ml="$spacing12" width="fit-content">
            <CurrencySelectButton
              disabled={!chainAllowed}
              tokenSelected={Boolean(currency)}
              selectorVisible={currency !== undefined}
              data-testid={`currency-${currency?.chainId}-${currency?.symbol}`}
              className="open-currency-select-button"
              {...shadowPropsShort}
              onPress={() => {
                if (onCurrencySelect) {
                  openModal()
                }
              }}
            >
              <Flex row alignItems="center" justifyContent="space-between" width="100%">
                <Flex row position="relative" width="fit-content">
                  <AnimatePresence>
                    <Flex
                      row
                      alignItems="center"
                      gap="$spacing6"
                      animation="300ms"
                      exitStyle={{ opacity: 0 }}
                      enterStyle={{ opacity: 0 }}
                    >
                      {currency ? <CurrencyLogo currency={currency} size={iconSizes.icon24} /> : null}
                      <Text className="token-symbol-container" variant="buttonLabel2">
                        {currency ? formatCurrencySymbol(currency) : t('tokens.selector.button.choose')}
                      </Text>
                    </Flex>
                  </AnimatePresence>
                </Flex>
                {onCurrencySelect ? (
                  <Flex centered mr="$spacing6" ml="$spacing8">
                    <RotatableChevron direction="down" size="$icon.16" color={currency ? '$neutral1' : '$white'} />
                  </Flex>
                ) : null}
              </Flex>
            </CurrencySelectButton>
          </Flex>
        </Flex>
        <Flex row alignItems="center" justifyContent="flex-end" minHeight="$spacing24" pt="$spacing8">
          <Flex row width="100%" justifyContent="flex-end" alignItems="center">
            <Flex row position="relative" width="fit-content" height={16}>
              <Text variant="body3" color="$neutral2" data-testid="balance-text" display="inline">
                {currency && selectedCurrencyBalance
                  ? t('swap.balance.amount', {
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
                    disabled={!chainAllowed}
                    onPress={onMax}
                  >
                    {t('swap.button.max')}
                  </Button>
                </Trace>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      {onCurrencySelect ? (
        <CurrencySearchModal
          currencyField={currencyField}
          isOpen={modalOpen}
          onDismiss={closeModal}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherCurrency}
          chainIds={chainIds}
          switchNetworkAction={switchNetworkAction ?? SwitchNetworkAction.Swap}
          swapTab={currentTab}
        />
      ) : null}
    </InputPanel>
  )
}
