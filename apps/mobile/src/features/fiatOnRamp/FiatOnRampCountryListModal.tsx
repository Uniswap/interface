import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SvgUri } from 'react-native-svg'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { Loader } from 'src/components/loading'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { useBottomSheetFocusHook } from 'src/components/modals/hooks'
import { IS_IOS } from 'src/constants/globals'
import { ModalName } from 'src/features/telemetry/constants'
import {
  AnimatedFlex,
  Flex,
  Inset,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useSporeColors,
} from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { fonts, iconSizes } from 'ui/src/theme'
import { bubbleToTop } from 'utilities/src/primitives/array'
import { useDebounce } from 'utilities/src/time/timing'
import { useFiatOnRampAggregatorCountryListQuery } from 'wallet/src/features/fiatOnRamp/api'
import {
  getCountryFlagSvgUrl,
  MeldCountryPaymentMethodsResponse,
} from 'wallet/src/features/fiatOnRamp/meld'

const ICON_SIZE = 32 // design prefers a custom value here

interface CountrySelectorProps {
  onSelectCountry: (country: NonNullable<MeldCountryPaymentMethodsResponse[0]>['country']) => void
  currentCountryCode: string
}

function key(item: NonNullable<MeldCountryPaymentMethodsResponse[0]>): string {
  // item.country.countryCode is already a string, but for some reason eslint thinks it's any, so we cast it
  return item.country.countryCode as string
}

function CountrySelectorContent({
  onSelectCountry,
  currentCountryCode,
}: CountrySelectorProps): JSX.Element {
  const { t } = useTranslation()

  const colors = useSporeColors()

  const { data, isLoading } = useFiatOnRampAggregatorCountryListQuery()

  const [searchText, setSearchText] = useState('')

  const debouncedSearchText = useDebounce(searchText)

  const filtredeData = useMemo(() => {
    if (!data) return []
    return bubbleToTop(data, (c) => c.country.countryCode === currentCountryCode).filter(
      (item) =>
        !debouncedSearchText ||
        item.country.displayName.toLowerCase().startsWith(debouncedSearchText.toLowerCase())
    )
  }, [currentCountryCode, data, debouncedSearchText])

  const renderItem = useCallback(
    ({
      item,
    }: ListRenderItemInfo<NonNullable<MeldCountryPaymentMethodsResponse[0]>>): JSX.Element => {
      const countryFlagUrl = getCountryFlagSvgUrl(item.country.countryCode)

      return (
        <TouchableArea onPress={(): void => onSelectCountry(item.country)}>
          <Flex row alignItems="center" gap="$spacing12" p="$spacing12">
            <Flex
              borderRadius="$roundedFull"
              height={ICON_SIZE}
              overflow="hidden"
              width={ICON_SIZE}>
              <SvgUri height={ICON_SIZE} uri={countryFlagUrl} width={ICON_SIZE} />
            </Flex>
            <Text>{item.country.displayName}</Text>
            {item.country.countryCode === currentCountryCode && (
              <Flex grow alignItems="flex-end" justifyContent="center">
                <Check
                  color={colors.accent1.get()}
                  height={iconSizes.icon20}
                  width={iconSizes.icon20}
                />
              </Flex>
            )}
          </Flex>
        </TouchableArea>
      )
    },
    [colors.accent1, currentCountryCode, onSelectCountry]
  )

  return (
    <Flex grow gap="$spacing16" pb={IS_IOS ? '$spacing16' : '$none'} px="$spacing16">
      <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
        {t('Select your region')}
      </Text>
      <SearchTextInput
        backgroundColor="$surface2"
        placeholder={t('Search by country or region')}
        py="$spacing8"
        value={searchText}
        onChangeText={setSearchText}
      />
      {true && (
        <Flex grow>
          <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
            {isLoading ? (
              <CountryListPlaceholder itemsCount={10} />
            ) : (
              <BottomSheetFlatList
                ListEmptyComponent={<Flex />}
                ListFooterComponent={<Inset all="$spacing36" />}
                bounces={true}
                data={filtredeData}
                focusHook={useBottomSheetFocusHook}
                keyExtractor={key}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="always"
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                windowSize={5}
              />
            )}
          </AnimatedFlex>
        </Flex>
      )}
    </Flex>
  )
}

const CountryListPlaceholder = React.memo(function CountryListPlaceholder({
  itemsCount,
}: {
  itemsCount: number
}): JSX.Element {
  const { fullWidth } = useDeviceDimensions()
  return (
    <Flex>
      {new Array(itemsCount).fill(null).map((_, i) => (
        <Flex key={i} row alignItems="center" gap="$spacing12" height={ICON_SIZE} m="$spacing12">
          <Loader.Box borderRadius="$roundedFull" height={ICON_SIZE} width={ICON_SIZE} />
          <Loader.Box height={fonts.subheading2.lineHeight} width={fullWidth / 2} />
        </Flex>
      ))}
    </Flex>
  )
})

export function FiatOnRampCountryListModal({
  onClose,
  onSelectCountry,
  currentCountryCode,
}: {
  onClose: () => void
} & CountrySelectorProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRampCountryList}
      snapPoints={['70%', '100%']}
      onClose={onClose}>
      <CountrySelectorContent
        currentCountryCode={currentCountryCode}
        onSelectCountry={onSelectCountry}
      />
    </BottomSheetModal>
  )
}
