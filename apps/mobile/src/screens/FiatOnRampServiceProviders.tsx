import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { useFocusEffect } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionListData } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Screen } from 'src/components/layout/Screen'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { ColorTokens, Flex, GeneratedIcon, Inset, Separator, Text } from 'ui/src'
import { TimePast } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { FORQuote, InitialQuoteSelection } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOnRampScreens } from 'uniswap/src/types/screens/mobile'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.ServiceProviders>

const key = (item: FORQuote): string => item.serviceProviderDetails.serviceProvider

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
    <Flex row alignItems="center" pb="$spacing12" pl="$spacing8">
      <Icon color={iconColor} size="$icon.16" />
      <Text color="$neutral2" pl="$spacing4" variant="body3">
        {title}
      </Text>
    </Flex>
  )
}

function Footer(): JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <Text color="$neutral2" px="$spacing24" textAlign="center" variant="body3">
        {t('fiatOnRamp.quote.advice')}
      </Text>
      <Inset all="$spacing8" />
    </>
  )
}

export function FiatOnRampServiceProvidersScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const { isOffRamp, setSelectedQuote, quotesSections, baseCurrencyInfo } = useFiatOnRampContext()

  const renderItem = ({ item }: ListRenderItemInfo<FORQuote>): JSX.Element => {
    const onPress = (): void => {
      const serviceProvider = item.serviceProviderDetails
      if (serviceProvider) {
        setSelectedQuote(item)
        navigation.navigate(FiatOnRampScreens.Connecting)
      }
    }
    return (
      <Flex px="$spacing12" py="$spacing8">
        {baseCurrencyInfo && <FORQuoteItem serviceProvider={item.serviceProviderDetails} onPress={onPress} />}
      </Flex>
    )
  }

  const renderSectionHeader = ({
    section: { type },
  }: {
    section: SectionListData<FORQuote, { type?: InitialQuoteSelection }>
  }): JSX.Element => (
    <Flex px="$spacing12">
      {type === InitialQuoteSelection.Best ? null : type === InitialQuoteSelection.MostRecent ? (
        <SectionHeader Icon={TimePast} iconColor="$neutral3" title={t('fiatOnRamp.quote.type.recent')} />
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

  return (
    <Screen edges={['top', 'bottom']}>
      <HandleBar backgroundColor="none" />
      <Flex height="100%">
        <Flex row alignItems="center" justifyContent="space-between" pb="$spacing16" pt="$spacing12" px="$spacing16">
          <BackButton />
          <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
            {isOffRamp ? t('fiatOffRamp.checkout.title') : t('fiatOnRamp.checkout.title')}
          </Text>
          <Flex width="$spacing24" />
        </Flex>
        <Flex grow gap="$spacing16" px="$spacing16">
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} pb="$spacing24" pt="$spacing4">
            <BottomSheetSectionList
              bounces
              ListEmptyComponent={<Flex />}
              ListFooterComponent={<Inset all="$spacing36" />}
              focusHook={useFocusEffect}
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
          </AnimatedFlex>
        </Flex>
        <Footer />
      </Flex>
    </Screen>
  )
}
