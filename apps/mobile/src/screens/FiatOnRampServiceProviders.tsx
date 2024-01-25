import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { FORQuoteItem } from 'src/components/fiatOnRamp/QuoteItem'
import { Screen } from 'src/components/layout/Screen'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { getServiceProviderForQuote } from 'src/features/fiatOnRamp/meldUtils'
import { InitialQuoteSelection } from 'src/features/fiatOnRamp/types'
import { MobileEventName } from 'src/features/telemetry/constants'
import { FiatOnRampScreens } from 'src/screens/Screens'
import { AnimatedFlex, Button, Flex, Icons, Inset, Separator, Text } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { useBottomSheetFocusHook } from 'wallet/src/components/modals/hooks'
import { MeldQuote } from 'wallet/src/features/fiatOnRamp/meld'
import { ElementName } from 'wallet/src/telemetry/constants'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.ServiceProviders>

const key = (item: MeldQuote): string => item.serviceProvider

export function FiatOnRampServiceProvidersScreen({ navigation: _navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const {
    selectedQuote,
    setSelectedQuote,
    quotesSections,
    quoteCurrency,
    baseCurrencyInfo,
    serviceProviders,
  } = useFiatOnRampContext()

  const renderItem = ({ item }: ListRenderItemInfo<MeldQuote>): JSX.Element => {
    return (
      <Flex px="$spacing12" py="$spacing8">
        {baseCurrencyInfo && (
          <FORQuoteItem
            active={selectedQuote === item}
            baseCurrency={baseCurrencyInfo}
            currency={quoteCurrency?.currencyInfo?.currency}
            loading={false}
            quote={item}
            serviceProvider={getServiceProviderForQuote(item, serviceProviders)}
            onPress={(): void => {
              setSelectedQuote(item)
            }}
          />
        )}
      </Flex>
    )
  }

  const renderSectionHeader = ({
    section: { type },
  }: {
    section: SectionListData<MeldQuote, { type?: InitialQuoteSelection }>
  }): JSX.Element => {
    return (
      <Flex px="$spacing12">
        {type ? (
          <Flex row alignItems="center" pl="$spacing8">
            <Icons.Verified color="$accent1" size="$icon.16" />
            <Text color="$neutral2" pl="$spacing4" variant="body3">
              {type === InitialQuoteSelection.Best ? t('Best overall') : t('Recently used')}
            </Text>
          </Flex>
        ) : (
          <Flex centered row gap="$spacing12" my="$spacing12">
            <Separator />
            <Text color="$neutral3" variant="body3">
              {t('Other options')}
            </Text>
            <Separator />
          </Flex>
        )}
      </Flex>
    )
  }

  const onContinue = (): void => {
    const serviceProvider = getServiceProviderForQuote(selectedQuote, serviceProviders)
    if (serviceProvider) {
      // TODO: Uncomment this when working on https://linear.app/uniswap/issue/MOB-2564/implement-connecting-screen
      // navigation.navigate(FiatOnRampScreens.Connecting)
    }
  }

  return (
    <Screen edges={['top']}>
      <HandleBar backgroundColor="none" />
      <Flex height="100%">
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          pb="$spacing16"
          pt="$spacing12"
          px="$spacing16">
          <BackButton />
          <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
            {t('Checkout with')}
          </Text>
          <Flex width="$spacing24" />
        </Flex>
        <Flex grow gap="$spacing16" px="$spacing16">
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} pb="$spacing24" pt="$spacing4">
            <BottomSheetSectionList
              bounces
              ListEmptyComponent={<Flex />}
              ListFooterComponent={<Inset all="$spacing36" />}
              focusHook={useBottomSheetFocusHook}
              keyExtractor={key}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="always"
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              sections={quotesSections ?? []}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              windowSize={5}
            />
            <Trace
              logPress
              element={ElementName.FiatOnRampWidgetButton}
              pressEvent={MobileEventName.FiatOnRampWidgetOpened}>
              <Button size="large" theme="primary" onPress={onContinue}>
                {t('Checkout')}
              </Button>
            </Trace>
          </AnimatedFlex>
        </Flex>
      </Flex>
    </Screen>
  )
}
