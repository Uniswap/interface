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
import { InitialQuoteSelection } from 'src/features/fiatOnRamp/types'
import { getServiceProviderForQuote } from 'src/features/fiatOnRamp/utils'
import { FiatOnRampScreens } from 'src/screens/Screens'
import {
  AnimatedFlex,
  Button,
  ColorTokens,
  Flex,
  GeneratedIcon,
  Icons,
  Inset,
  Separator,
  Text,
} from 'ui/src'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { useBottomSheetFocusHook } from 'wallet/src/components/modals/hooks'
import { FORQuote } from 'wallet/src/features/fiatOnRamp/types'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.ServiceProviders>

const key = (item: FORQuote): string => item.serviceProvider

function SectionHeader({
  Icon,
  title,
  iconColor,
}: {
  Icon: GeneratedIcon
  title: string
  iconColor: ColorTokens
}): JSX.Element {
  return (
    <Flex row alignItems="center" pl="$spacing8">
      <Icon color={iconColor} size="$icon.16" />
      <Text color="$neutral2" pl="$spacing4" variant="body3">
        {title}
      </Text>
    </Flex>
  )
}

export function FiatOnRampServiceProvidersScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const {
    selectedQuote,
    setSelectedQuote,
    quotesSections,
    quoteCurrency,
    baseCurrencyInfo,
    serviceProviders,
  } = useFiatOnRampContext()

  const renderItem = ({ item }: ListRenderItemInfo<FORQuote>): JSX.Element => {
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
    section: SectionListData<FORQuote, { type?: InitialQuoteSelection }>
  }): JSX.Element => (
    <Flex px="$spacing12">
      {type === InitialQuoteSelection.Best ? (
        <SectionHeader
          Icon={Icons.Verified}
          iconColor="$accent1"
          title={t('fiatOnRamp.quote.type.best')}
        />
      ) : type === InitialQuoteSelection.MostRecent ? (
        <SectionHeader
          Icon={Icons.TimePast}
          iconColor="$neutral3"
          title={t('fiatOnRamp.quote.type.recent')}
        />
      ) : (
        <Flex centered row gap="$spacing12" my="$spacing12">
          <Separator />
          <Text color="$neutral3" variant="body3">
            {t('fiatOnRamp.quote.type.other')}
          </Text>
          <Separator />
        </Flex>
      )}
    </Flex>
  )

  const onContinue = (): void => {
    const serviceProvider = getServiceProviderForQuote(selectedQuote, serviceProviders)
    if (serviceProvider) {
      navigation.navigate(FiatOnRampScreens.Connecting)
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
            {t('fiatOnRamp.checkout.title')}
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
            <Button size="large" theme="primary" onPress={onContinue}>
              {t('fiatOnRamp.checkout.button')}
            </Button>
          </AnimatedFlex>
        </Flex>
      </Flex>
    </Screen>
  )
}
