import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, GeneratedIcon, Text, TouchableArea } from 'ui/src'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Bank } from 'ui/src/components/icons/Bank'
import { Buy } from 'ui/src/components/icons/Buy'
import { GoogleLogo } from 'ui/src/components/icons/GoogleLogo'
import { PaypalLogo } from 'ui/src/components/icons/PaypalLogo'
import { VenmoLogo } from 'ui/src/components/icons/VenmoLogo'
import { iconSizes } from 'ui/src/theme'
import { FORFilters, FORFiltersMap, FORQuote } from 'uniswap/src/features/fiatOnRamp/types'
import { isAndroid, isIOS, isWebAndroid, isWebIOS } from 'utilities/src/platform'

export type PaymentMethodFilterProps = FlexProps & {
  quotes?: Maybe<FORQuote[]>
  paymentMethod?: FORFilters
  setPaymentMethod: (method?: FORFilters) => void
  isOffRamp: boolean
}

export type PaymentMethodConfig = {
  filter: FORFilters
  icon: GeneratedIcon
  label: string
  isSupported: boolean
}

export function usePaymentMethodConfigs(): PaymentMethodConfig[] {
  const { t } = useTranslation()

  return useMemo(
    () => [
      {
        filter: FORFilters.ApplePay,
        icon: AppleLogo,
        label: t('fiatOnRamp.paymentMethods.applePay'),
        isSupported: isIOS || isWebIOS,
      },
      {
        filter: FORFilters.GooglePay,
        icon: GoogleLogo,
        label: t('fiatOnRamp.paymentMethods.googlePay'),
        isSupported: isAndroid || isWebAndroid,
      },
      {
        filter: FORFilters.Bank,
        icon: Bank,
        label: t('fiatOnRamp.paymentMethods.bank'),
        isSupported: true,
      },
      {
        filter: FORFilters.Debit,
        icon: Buy,
        label: t('fiatOnRamp.paymentMethods.debit'),
        isSupported: true,
      },
      {
        filter: FORFilters.PayPal,
        icon: PaypalLogo,
        label: t('fiatOnRamp.paymentMethods.paypal'),
        isSupported: true,
      },
      {
        filter: FORFilters.Venmo,
        icon: VenmoLogo,
        label: t('fiatOnRamp.paymentMethods.venmo'),
        isSupported: true,
      },
    ],
    [t],
  )
}

export function useEnabledPaymentMethodFilters(quotes?: Maybe<FORQuote[]>): PaymentMethodConfig[] {
  const paymentMethodConfigs = usePaymentMethodConfigs()

  return useMemo(() => {
    const useablePaymentMethods = quotes
      ?.flatMap((quote) => quote.serviceProviderDetails.paymentMethods)
      .flatMap((paymentMethod) => {
        const mappedFilter = FORFiltersMap[paymentMethod]
        return mappedFilter
      })

    return paymentMethodConfigs.filter(({ filter, isSupported }) => {
      return useablePaymentMethods?.includes(filter) && isSupported
    })
  }, [quotes, paymentMethodConfigs])
}

export function useTogglePaymentMethod(
  paymentMethod: FORFilters | undefined,
  setPaymentMethod: (method?: FORFilters) => void,
): (method: FORFilters) => void {
  return useCallback(
    (method: FORFilters) => {
      setPaymentMethod(paymentMethod === method ? undefined : method)
    },
    [paymentMethod, setPaymentMethod],
  )
}

type PaymentMethodItemProps = {
  filter: FORFilters
  icon: GeneratedIcon
  label: string
  isSelected: boolean
  onPress: () => void
}

export function PaymentMethodItem({
  filter,
  icon: Icon,
  label,
  isSelected,
  onPress,
}: PaymentMethodItemProps): JSX.Element {
  return (
    <TouchableArea key={filter} scaleTo={0.95} onPress={onPress}>
      <Flex
        row
        alignItems="center"
        gap="$gap4"
        p="$spacing8"
        pl="$spacing4"
        backgroundColor={isSelected ? '$surface3' : '$surface1'}
        borderColor="$surface3"
        borderWidth={1}
        borderRadius="$rounded12"
      >
        <Icon size={iconSizes.icon20} color="$neutral1" />
        <Text variant="body3" color="$neutral1">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}

export function useRenderPaymentMethod(
  paymentMethod: FORFilters | undefined,
  handleTogglePaymentMethod: (method: FORFilters) => void,
): ({ item }: { item: PaymentMethodConfig }) => JSX.Element {
  return useCallback(
    ({ item: { filter, icon, label } }: { item: PaymentMethodConfig }) => {
      const isSelected = paymentMethod === filter

      return (
        <PaymentMethodItem
          filter={filter}
          icon={icon}
          label={label}
          isSelected={isSelected}
          onPress={() => handleTogglePaymentMethod(filter)}
        />
      )
    },
    [paymentMethod, handleTogglePaymentMethod],
  )
}
