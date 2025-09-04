import { Flex, useIsShortMobileDevice } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { ElementName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SwapArrowButton } from 'uniswap/src/features/transactions/swap/components/SwapArrowButton'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const SWAP_DIRECTION_BUTTON_SIZE = {
  size: {
    regular: iconSizes.icon24,
    small: iconSizes.icon12,
  },
  innerPadding: {
    regular: spacing.spacing8 + spacing.spacing2,
    small: spacing.spacing8,
  },
  borderWidth: {
    regular: spacing.spacing4,
    small: spacing.spacing1,
  },
} as const

export function SwitchCurrenciesButton(): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const smallOrRegular = isShortMobileDevice ? 'small' : 'regular'
  const onSwitchCurrencies = useSwapFormScreenStore((state) => state.onSwitchCurrencies)

  return (
    <Flex zIndex="$mask">
      <Flex alignItems="center" height={0}>
        <Flex
          alignItems="center"
          bottom={
            -(
              // (icon size + (top + bottom padding) + (top + bottom border)) / 2
              // to center the swap direction button vertically
              (
                SWAP_DIRECTION_BUTTON_SIZE.size[smallOrRegular] +
                SWAP_DIRECTION_BUTTON_SIZE.innerPadding[smallOrRegular] * 2 +
                SWAP_DIRECTION_BUTTON_SIZE.borderWidth[smallOrRegular] * 2
              )
            ) / 2
          }
          position="absolute"
        >
          <Trace
            logPress
            element={ElementName.SwitchCurrenciesButton}
            eventOnTrigger={SwapEventName.SwapTokensReversed}
          >
            <SwapArrowButton
              backgroundColor="$surface2"
              iconSize={SWAP_DIRECTION_BUTTON_SIZE.size[smallOrRegular]}
              testID={TestID.SwitchCurrenciesButton}
              onPress={onSwitchCurrencies}
            />
          </Trace>
        </Flex>
      </Flex>
    </Flex>
  )
}
