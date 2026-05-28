import { Flex, FlexProps } from 'ui/src'
import {
  PaymentMethodFilterProps,
  PaymentMethodItem,
  useEnabledPaymentMethodFilters,
  useTogglePaymentMethod,
} from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/utils'
import { FORFilters } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOffRampEventName, FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function PaymentMethodFilter({
  paymentMethod,
  setPaymentMethod,
  isOffRamp,
  quotes,
  ...rest
}: PaymentMethodFilterProps & FlexProps): JSX.Element {
  const enabledPaymentMethodFilters = useEnabledPaymentMethodFilters(quotes)
  const handleTogglePaymentMethod: (method: FORFilters) => void = useTogglePaymentMethod(
    paymentMethod,
    setPaymentMethod,
  )
  const handleOnPress = (filter: FORFilters): void => {
    handleTogglePaymentMethod(filter)
    if (isOffRamp) {
      sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampPaymentMethodFilterSelected, { paymentMethodFilter: filter })
    } else {
      sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampPaymentMethodFilterSelected, { paymentMethodFilter: filter })
    }
  }

  return (
    <Flex row alignItems="center" gap="$gap8" overflow="scroll" scrollbarWidth="none" {...rest}>
      {enabledPaymentMethodFilters.map(({ filter, icon, label }) => {
        const isSelected = paymentMethod === filter

        return (
          <PaymentMethodItem
            key={filter}
            filter={filter}
            icon={icon}
            label={label}
            isSelected={isSelected}
            onPress={() => handleOnPress(filter)}
          />
        )
      })}
    </Flex>
  )
}
