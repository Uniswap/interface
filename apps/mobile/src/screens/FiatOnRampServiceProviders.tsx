import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { Flex, Inset, Text } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { EdgeFade } from 'uniswap/src/features/fiatOnRamp/EdgeFade/EdgeFade'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { PaymentMethodFilter } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter'
import { FORQuote } from 'uniswap/src/features/fiatOnRamp/types'
import { filterQuotesByPaymentMethod } from 'uniswap/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FiatOffRampEventName, FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useIsForFiltersEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsForFiltersEnabled'
import { FiatOnRampScreens } from 'uniswap/src/types/screens/mobile'
import { NumberType } from 'utilities/src/format/types'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.ServiceProviders>

const key = (item: FORQuote): string => item.serviceProviderDetails.serviceProvider

function Footer(): JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <Text color="$neutral2" px="$spacing24" textAlign="center" variant="body4">
        {t('fiatOnRamp.quote.advice')}
      </Text>
      <Inset all="$spacing8" />
    </>
  )
}

export function FiatOnRampServiceProvidersScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const {
    isOffRamp,
    setSelectedQuote,
    quotesSections,
    baseCurrencyInfo,
    paymentMethod,
    setPaymentMethod,
    fiatAmount,
    quoteCurrency,
    countryCode,
    countryState,
    externalTransactionIdSuffix,
  } = useFiatOnRampContext()
  const isFORFiltersEnabled = useIsForFiltersEnabled()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // Reset payment method when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setPaymentMethod(undefined)
    }, [setPaymentMethod]),
  )

  const filteredQuotes = useMemo(() => {
    if (!quotesSections) {
      return undefined
    }
    return filterQuotesByPaymentMethod(
      quotesSections.flatMap((section) => section.data),
      paymentMethod,
    )
  }, [quotesSections, paymentMethod])

  const allQuotes = useMemo(() => {
    return quotesSections?.flatMap((section) => section.data)
  }, [quotesSections])

  const renderItem = ({ item }: ListRenderItemInfo<FORQuote>): JSX.Element => {
    const isHidden = !filteredQuotes?.includes(item)
    const onPress = (): void => {
      setSelectedQuote(item)
      if (baseCurrencyInfo && quoteCurrency.currencyInfo) {
        sendAnalyticsEvent(
          isOffRamp ? FiatOffRampEventName.FiatOffRampWidgetOpened : FiatOnRampEventName.FiatOnRampWidgetOpened,
          {
            countryCode,
            countryState,
            cryptoCurrency: quoteCurrency.currencyInfo.currencyId,
            externalTransactionId: externalTransactionIdSuffix,
            fiatCurrency: baseCurrencyInfo.symbol,
            serviceProvider: item.serviceProviderDetails.serviceProvider,
            paymentMethodFilter: paymentMethod,
          },
        )
      }
      navigation.navigate(FiatOnRampScreens.Connecting)
    }
    return (
      <Flex px="$spacing8" py={isHidden ? 0 : '$spacing8'}>
        {baseCurrencyInfo && (
          <FORQuoteItem
            serviceProvider={item.serviceProviderDetails}
            showPaymentMethods={!paymentMethod}
            isRecent={item.isMostRecentlyUsedProvider}
            hidden={isHidden}
            onPress={onPress}
          />
        )}
      </Flex>
    )
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <HandleBar backgroundColor="none" />
      <Flex height="100%" gap="$spacing20">
        <Flex px="$spacing24" gap="$gap12" alignItems="flex-start">
          <BackButton size={iconSizes.icon24} />
          <Flex row alignItems="center" justifyContent="space-between" width="100%">
            <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="heading3">
              {isOffRamp ? t('fiatOffRamp.checkout.title') : t('fiatOnRamp.checkout.title')}
            </Text>
            <Flex row gap="$spacing12" alignItems="center">
              <Text variant="body1" color="$neutral2">
                {convertFiatAmountFormatted(fiatAmount, NumberType.FiatTokenPrice)}
              </Text>
              {quoteCurrency.currencyInfo && (
                <CurrencyLogo currencyInfo={quoteCurrency.currencyInfo} size={iconSizes.icon24} />
              )}
            </Flex>
          </Flex>
        </Flex>
        {isFORFiltersEnabled && !!quotesSections?.length && (
          <Flex>
            <EdgeFade side="left" width={24} />
            <PaymentMethodFilter
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isOffRamp={isOffRamp}
              quotes={allQuotes}
            />
            <EdgeFade side="right" width={24} />
          </Flex>
        )}
        <Flex grow px="$spacing16">
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} pb="$spacing24">
            <BottomSheetSectionList
              bounces
              ListEmptyComponent={<Flex />}
              ListFooterComponent={<Inset all="$spacing36" />}
              focusHook={useFocusEffect}
              keyExtractor={key}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="always"
              renderItem={renderItem}
              sections={quotesSections ?? []}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              windowSize={5}
            />
          </AnimatedFlex>
        </Flex>
        <Footer />
      </Flex>
    </Screen>
  )
}
