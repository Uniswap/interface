import {
  Flex,
  type FlexCompatProps,
  Text,
  UniversalList,
  type UniversalListRef,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
  useMedia,
} from '@universe/mycelium'
import { TestID } from '@universe/test'
import {
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ModalCloseIcon, useScrollbarStyles } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useFilteredCountryData } from 'uniswap/src/features/fiatOnRamp/hooks/useFilteredCountryData'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SearchInput } from '~/components/SearchModal/styled'
import { CountryListRow } from '~/pages/Swap/Buy/CountryListRow'
import { ContentWrapper } from '~/pages/Swap/Buy/shared'

const ROW_ITEM_SIZE = 56
// Same ratio as the token selector sheet; only index 0 is read on web.
const SNAP_POINTS = ['65%', '100%']

function countryKey(country: FORCountry): string {
  return country.countryCode
}

/** Every row is pinned to `ROW_ITEM_SIZE` below, so the declared size can't drift from the rendered one. */
function rowSize(): number {
  return ROW_ITEM_SIZE
}

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const HeaderContent: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function HeaderContent({ $sm: sm, ...props }, ref) {
  // Merged explicitly, not spread: a plain spread would replace this base wholesale.
  return <Flex ref={ref} flexShrink={1} $sm={{ pt: '$none', ...sm }} p="$spacing20" gap="$spacing12" {...props} />
})

interface CountryListModalProps {
  isOpen: boolean
  onDismiss: () => void
  onSelectCountry: (country: FORCountry) => void
  selectedCountry?: FORCountry
  countryList: FORCountry[]
}

export function CountryListModal({
  isOpen,
  onDismiss,
  countryList,
  selectedCountry,
  onSelectCountry,
}: CountryListModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { t } = useTranslation()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()

  const filteredData = useFilteredCountryData({
    countries: countryList,
    searchText: searchQuery,
    selectedCountryCode: selectedCountry?.countryCode,
  })

  const listRef = useRef<UniversalListRef>(null)
  const handleInput = useCallback((text: string) => {
    setSearchQuery(text)
    listRef.current?.scrollToTop()
  }, [])

  const closeModal = useCallback(() => {
    setSearchQuery('')
    onDismiss()
  }, [onDismiss])

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<FORCountry>): JSX.Element => (
      <CountryListRow
        // `RowWrapper` defaults to 60; these rows render at 56. Must match what `rowSize` declares
        // or the engine positions each row short of the next and they overlap.
        style={{ height: ROW_ITEM_SIZE }}
        country={item}
        selectedCountry={selectedCountry}
        onClick={() => {
          onSelectCountry(item)
          closeModal()
        }}
      />
    ),
    [selectedCountry, onSelectCountry, closeModal],
  )

  const listStyle = useMemo<UniversalListStyle>(() => ({ style: scrollbarStyles }), [scrollbarStyles])

  return (
    <Modal
      name={ModalName.FiatOnRampCountryList}
      maxWidth={420}
      height={media.sm ? '100vh' : '100%'}
      maxHeight={700}
      // The mWeb sheet must take its height from the snap point, not content-fit: the virtualized
      // list sizes itself to its container, so a fit-mode sheet collapses to chrome height with an empty list.
      snapPoints={SNAP_POINTS}
      snapPointsMode="percent"
      isModalOpen={isOpen}
      onClose={onDismiss}
      padding={0}
    >
      <ContentWrapper>
        <HeaderContent>
          <Flex width="100%" row justifyContent="space-between">
            <Text variant="body2">{t('common.selectRegion.label')}</Text>
            <ModalCloseIcon testId={TestID.CountryListModalClose} onClose={closeModal} />
          </Flex>
          <Flex position="relative" width="100%" height="$spacing40">
            <Flex
              position="absolute"
              left="$spacing12"
              top={0}
              bottom={0}
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              <Search size="$icon.20" color="$neutral3" />
            </Flex>
            <SearchInput
              placeholder={t`swap.buy.countryModal.placeholder`}
              value={searchQuery}
              onChangeText={handleInput}
            />
          </Flex>
        </HeaderContent>
        {/* Web `fill` is `flex: 1 1 auto`, so without a 0 basis the content height squeezes the header. */}
        <Flex fill flexBasis={0}>
          <UniversalList
            ref={listRef}
            data={filteredData}
            // Cells memoize on (key, item, extraData). `bubbleToTop` returns a reordered array of the
            // same country objects, so a selection change leaves every row's key and item untouched —
            // without this the checkmark stays on the previously selected row.
            extraData={selectedCountry?.countryCode}
            getFixedItemSize={rowSize}
            keyExtractor={countryKey}
            renderItem={renderItem}
            style={listStyle}
          />
        </Flex>
      </ContentWrapper>
    </Modal>
  )
}
