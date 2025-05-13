import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SvgUri } from 'react-native-svg'
import { Loader } from 'src/components/loading/loaders'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { Check } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { fonts, spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useFiatOnRampAggregatorCountryListQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FOR_MODAL_SNAP_POINTS } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORCountry, RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { getCountryFlagSvgUrl } from 'uniswap/src/features/fiatOnRamp/utils'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { bubbleToTop } from 'utilities/src/primitives/array'
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
    rampDirection: isOffRamp ? RampDirection.OFFRAMP : RampDirection.ONRAMP,
  })

  const [searchText, setSearchText] = useState('')

  const debouncedSearchText = useDebounce(searchText)

  const filteredData: FORCountry[] = useMemo(() => {
    if (!data) {
      return []
    }
    return bubbleToTop(data.supportedCountries, (c) => c.countryCode === countryCode).filter(
      (item) => !debouncedSearchText || item.displayName.toLowerCase().startsWith(debouncedSearchText.toLowerCase()),
    )
  }, [countryCode, data, debouncedSearchText])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<FORCountry>): JSX.Element => {
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
            <AnimatedBottomSheetFlashList
              ListEmptyComponent={<Flex />}
              bounces={true}
              contentContainerStyle={{ paddingBottom: insets.bottom + spacing.spacing12 }}
              data={filteredData}
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
