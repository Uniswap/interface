import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import {
  Button,
  cn,
  Flex,
  type FlexCompatProps,
  Text,
  TouchableArea,
  type TouchableAreaCompatProps,
} from '@universe/mycelium'
import { ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { useShadowPropsShort } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { forwardRef, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { SwapCurrencyInput } from '~/components/NumericalInput/NumericalInput'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { formatCurrencySymbol } from '~/features/Swap/CurrencyInputPanel/utils'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useAccount } from '~/hooks/useAccount'
import { useCurrencyBalance } from '~/state/connection/hooks'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import { SwitchNetworkAction } from '~/state/popups/types'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const InputPanel: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function InputPanel({ '$platform-web': platformWeb, className, ...props }, ref) {
  return (
    <Flex
      ref={ref}
      flexWrap="nowrap"
      position="relative"
      borderRadius="$rounded20"
      zIndex={1}
      width="initial"
      // `willChange` is not on the compat prop surface, so the hint is carried as a class.
      // Preset first so a caller's own class wins the merge.
      className={cn('will-change-[height]', className)}
      // Merged explicitly, not spread: a plain spread would drop the height transition.
      $platform-web={{ transition: 'height 1s ease', ...platformWeb }}
      {...props}
    />
  )
})

/** Total map, not an override on a base — which is why the wrapper below can spread it. */
const TOKEN_SELECTED_STYLE = {
  true: {
    backgroundColor: '$surface1',
    borderColor: '$surface3',
    color: '$neutral1',
    p: '$spacing4',
    pr: '$spacing8',
    hoverStyle: { backgroundColor: '$surface1Hovered' },
    pressStyle: { backgroundColor: '$surface1Hovered' },
  },
  false: {
    backgroundColor: '$accent1',
    borderColor: '$accent1',
    color: '$white',
    p: '$spacing6',
    pl: '$spacing8',
    hoverStyle: { backgroundColor: '$accent1Hovered' },
    pressStyle: { backgroundColor: '$accent1Hovered' },
  },
} as const

/** Legacy `disabledStyle`. The `pointerEvents` cell is what stops a press landing on a disabled control. */
const DISABLED_STYLE = { opacity: 0.4, pointerEvents: 'none' } as const

const CurrencySelectButton = forwardRef<
  HTMLElement,
  TouchableAreaCompatProps & { tokenSelected?: boolean; selectorVisible?: boolean }
>(function CurrencySelectButton(
  { tokenSelected = false, selectorVisible = true, className, disabledStyle, hoverStyle, pressStyle, ...props },
  ref,
) {
  const selected = TOKEN_SELECTED_STYLE[tokenSelected ? 'true' : 'false']
  return (
    <TouchableArea
      ref={ref}
      tag="button"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      height="$spacing36"
      borderRadius="$roundedFull"
      outlineWidth={0}
      borderWidth="$spacing1"
      borderStyle="solid"
      width="fit-content"
      gap="$spacing8"
      userSelect="none"
      // `visibility` is not on the compat prop surface, so this is a class. `invisible` is
      // `visibility: hidden`: keeps the box in flow and drops it out of focus order.
      // Preset first so a caller's own class wins the merge.
      className={cn(selectorVisible ? 'visible' : 'invisible', className)}
      {...selected}
      // Merged explicitly, not spread: a replacing spread would drop `disabledStyle`'s
      // `pointerEvents: 'none'` and leave a disabled button that still takes presses.
      disabledStyle={{ ...DISABLED_STYLE, ...disabledStyle }}
      hoverStyle={{ ...selected.hoverStyle, ...hoverStyle }}
      pressStyle={{ ...selected.pressStyle, ...pressStyle }}
      {...props}
    />
  )
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
  const currencyInfo = useCurrencyInfo(currencyId(currency))
  const { formatCurrencyAmount } = useLocalizationContext()
  const { t } = useTranslation()

  const isInputDisabled = !chainAllowed

  return (
    <InputPanel id={id}>
      <Flex minHeight={44} borderRadius="$rounded20" width="initial">
        <Text variant="body3" userSelect="none" color="$neutral2">
          {label}
        </Text>
        <Flex row flexWrap="nowrap" alignItems="center" justifyContent="space-between" mt="$spacing4">
          <Flex fill minWidth={0}>
            <SwapCurrencyInput
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
                  {/* Mount fade only — the legacy AnimatePresence wrapped this same unconditional,
                      unkeyed child, so no exit or currency-change crossfade ever played. */}
                  <Flex row alignItems="center" gap="$spacing6" className={ENTER_PRESET_CLASSES.fadeIn}>
                    {currency ? <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} /> : null}
                    <Text className="token-symbol-container" variant="buttonLabel2">
                      {currency ? formatCurrencySymbol(currency) : t('tokens.selector.button.choose')}
                    </Text>
                  </Flex>
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
