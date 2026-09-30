import { Flex, type FlexCompatProps, Text, useMedia } from '@universe/mycelium'
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
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { ModalCloseIcon, useScrollbarStyles } from 'ui/src'
import { Search } from 'ui/src/components/icons/Search'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { bubbleToTop } from 'utilities/src/primitives/array'
import { SearchInput } from '~/components/SearchModal/styled'
import { CountryListRow } from '~/pages/Swap/Buy/CountryListRow'
import { ContentWrapper } from '~/pages/Swap/Buy/shared'

const ROW_ITEM_SIZE = 56
// Same ratio as the token selector sheet; only index 0 is read on web.
const SNAP_POINTS = ['65%', '100%']

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

  const filteredData: FORCountry[] = useMemo(() => {
    const sorted = bubbleToTop(countryList, (c) => c.countryCode === selectedCountry?.countryCode)
    if (searchQuery) {
      return sorted.filter((item) => item.displayName.toLowerCase().startsWith(searchQuery.toLowerCase()))
    } else {
      return sorted
    }
  }, [countryList, searchQuery, selectedCountry?.countryCode])

  const fixedList = useRef<FixedSizeList>(undefined)
  const handleInput = useCallback((text: string) => {
    setSearchQuery(text)
    fixedList.current?.scrollTo(0)
  }, [])

  const closeModal = useCallback(() => {
    setSearchQuery('')
    onDismiss()
  }, [onDismiss])

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
        <Flex grow>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <Flex data-testid="country-list-wrapper">
                <FixedSizeList
                  height={height}
                  ref={fixedList as any}
                  width="100%"
                  itemData={filteredData}
                  itemCount={filteredData.length}
                  itemSize={ROW_ITEM_SIZE}
                  itemKey={(index: number, data: typeof countryList) => data[index]?.countryCode}
                  style={scrollbarStyles}
                >
                  {({ style, data, index }) => (
                    <CountryListRow
                      style={style}
                      country={data[index]}
                      selectedCountry={selectedCountry}
                      onClick={() => {
                        onSelectCountry(data[index])
                        closeModal()
                      }}
                    />
                  )}
                </FixedSizeList>
              </Flex>
            )}
          </AutoSizer>
        </Flex>
      </ContentWrapper>
    </Modal>
  )
}
