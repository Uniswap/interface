import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SvgUri } from 'react-native-svg'
import { Loader } from 'src/components/loading'
import { FOR_MODAL_SNAP_POINTS } from 'src/features/fiatOnRamp/constants'
import {
  AnimatedFlex,
  Flex,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useDeviceInsets,
  useSporeColors,
} from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { bubbleToTop } from 'utilities/src/primitives/array'
import { useDebounce } from 'utilities/src/time/timing'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { useBottomSheetFocusHook } from 'wallet/src/components/modals/hooks'
import { useFiatOnRampAggregatorCountryListQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORCountry } from 'wallet/src/features/fiatOnRamp/types'
import { getCountryFlagSvgUrl } from 'wallet/src/features/fiatOnRamp/utils'
import { SearchTextInput } from 'wallet/src/features/search/SearchTextInput'
import { ModalName } from 'wallet/src/telemetry/constants'

const ICON_SIZE = 32 // design prefers a custom value here

interface CountrySelectorProps {
  onSelectCountry: (country: FORCountry) => void
  countryCode: string
}

function key(item: FORCountry): string {
  return item.countryCode
}

function CountrySelectorContent({
  onSelectCountry,
  countryCode,
}: CountrySelectorProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useDeviceInsets()
  const colors = useSporeColors()

  const { data, isLoading } = useFiatOnRampAggregatorCountryListQuery()

  const [searchText, setSearchText] = useState('')

  const debouncedSearchText = useDebounce(searchText)

  const filteredData: FORCountry[] = useMemo(() => {
    if (!data) {
      return []
    }
    return bubbleToTop(data.supportedCountries, (c) => c.countryCode === countryCode).filter(
      (item) =>
        !debouncedSearchText ||
        item.displayName.toLowerCase().startsWith(debouncedSearchText.toLowerCase())
    )
  }, [countryCode, data, debouncedSearchText])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FORCountry>): JSX.Element => {
      const countryFlagUrl = getCountryFlagSvgUrl(item.countryCode)

      return (
        <TouchableArea onPress={(): void => onSelectCountry(item)}>
          <Flex row alignItems="center" gap="$spacing12" p="$spacing12">
            <Flex
              borderRadius="$roundedFull"
              height={ICON_SIZE}
              overflow="hidden"
              width={ICON_SIZE}>
              <SvgUri height={ICON_SIZE} uri={countryFlagUrl} width={ICON_SIZE} />
            </Flex>
            <Text>{item.displayName}</Text>
            {item.countryCode === countryCode && (
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
    [colors.accent1, countryCode, onSelectCountry]
  )

  return (
    <Flex grow gap="$spacing16" px="$spacing16">
      <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
        {t('fiatOnRamp.region.title')}
      </Text>
      <SearchTextInput
        backgroundColor="$surface2"
        placeholder={t('fiatOnRamp.region.placeholder')}
        py="$spacing8"
        value={searchText}
        onChangeText={setSearchText}
      />
      <Flex grow>
        <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
          {isLoading ? (
            <CountryListPlaceholder itemsCount={10} />
          ) : (
            <BottomSheetFlatList
              ListEmptyComponent={<Flex />}
              bounces={true}
              contentContainerStyle={{ paddingBottom: insets.bottom + spacing.spacing12 }}
              data={filteredData}
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
  countryCode,
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
      renderBehindBottomInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRampCountryList}
      snapPoints={FOR_MODAL_SNAP_POINTS}
      onClose={onClose}>
      <CountrySelectorContent countryCode={countryCode} onSelectCountry={onSelectCountry} />
    </BottomSheetModal>
  )
}
