import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import {
  Flex,
  fonts,
  spacing,
  Text,
  TouchableArea,
  UniversalList,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
} from '@universe/mycelium'
import { useDeviceDimensions, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SvgUri } from 'react-native-svg'
import { Loader } from 'src/components/loading/loaders'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { Check } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FOR_MODAL_SNAP_POINTS } from 'uniswap/src/features/fiatOnRamp/constants'
import { useFiatOnRampAggregatorCountryListQuery } from 'uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries'
import { useFilteredCountryData } from 'uniswap/src/features/fiatOnRamp/hooks/useFilteredCountryData'
import { FORCountry, RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { getCountryFlagSvgUrl } from 'uniswap/src/features/fiatOnRamp/utils'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useDebounce } from 'utilities/src/time/timing'

const ICON_SIZE = 32 // design prefers a custom value here

interface CountrySelectorProps {
  onSelectCountry: (country: FORCountry) => void
  countryCode: string
}

function key(item: FORCountry): string {
  return item.countryCode
}

function CountrySelectorContent({ onSelectCountry, countryCode }: CountrySelectorProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const { isOffRamp } = useFiatOnRampContext()

  const { data, isLoading } = useFiatOnRampAggregatorCountryListQuery({
    rampDirection: isOffRamp ? RampDirection.OFF_RAMP : RampDirection.ON_RAMP,
  })

  const [searchText, setSearchText] = useState('')

  const debouncedSearchText = useDebounce(searchText)

  const filteredData = useFilteredCountryData({
    countries: data?.supportedCountries,
    searchText: debouncedSearchText,
    selectedCountryCode: countryCode,
  })

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<FORCountry>): JSX.Element => {
      const countryFlagUrl = getCountryFlagSvgUrl(item.countryCode)

      return (
        <TouchableArea onPress={(): void => onSelectCountry(item)}>
          <Flex row alignItems="center" gap="$spacing12" p="$spacing12">
            <Flex borderRadius="$roundedFull" height={ICON_SIZE} overflow="hidden" width={ICON_SIZE}>
              <SvgUri height={ICON_SIZE} uri={countryFlagUrl} width={ICON_SIZE} />
            </Flex>
            <Text>{item.displayName}</Text>
            {item.countryCode === countryCode && (
              <Flex grow alignItems="flex-end" justifyContent="center">
                <Check color="$accent1" size="$icon.20" />
              </Flex>
            )}
          </Flex>
        </TouchableArea>
      )
    },
    [countryCode, onSelectCountry],
  )

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({ style: { paddingBottom: insets.bottom + spacing.spacing12 } }),
    [insets.bottom],
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
      {/* `fill` (flex:1) not `grow` (flexGrow:1): Legend List needs a parent with a definite height, else it
          sizes to its content and pushes the title under the search input (same trap as SelectorBaseList). */}
      <Flex fill>
        <AnimatedFlex grow entering={FadeIn} exiting={FadeOut}>
          {isLoading ? (
            <CountryListPlaceholder itemsCount={10} />
          ) : (
            <UniversalList
              contentContainerStyle={contentContainerStyle}
              data={filteredData}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="always"
              keyExtractor={key}
              ListEmptyComponent={<Flex />}
              renderItem={renderItem}
              // Always rendered inside a bottom sheet, so scroll gestures route through the sheet's scrollable.
              renderScrollComponent={BottomSheetScrollView}
              showsVerticalScrollIndicator={false}
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
    <Modal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      overrideInnerContainer
      renderBehindBottomInset
      backgroundColor={colors.surface1.val}
      name={ModalName.FiatOnRampCountryList}
      snapPoints={FOR_MODAL_SNAP_POINTS}
      onClose={onClose}
    >
      <CountrySelectorContent countryCode={countryCode} onSelectCountry={onSelectCountry} />
    </Modal>
  )
}
