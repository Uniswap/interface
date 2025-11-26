import { ReactComponent as SearchIcon } from 'assets/svg/search.svg'
import { SearchInput } from 'components/SearchModal/styled'
import { CountryListRow } from 'pages/Swap/Buy/CountryListRow'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Flex, ModalCloseIcon, styled, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { bubbleToTop } from 'utilities/src/primitives/array'

const ROW_ITEM_SIZE = 56
export const HeaderContent = styled(Flex, {
  flexShrink: 1,
  $sm: { pt: '$none' },
  p: '$spacing20',
  gap: '$spacing12',
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
  const colors = useSporeColors()
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
  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    setSearchQuery(input)
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
      isModalOpen={isOpen}
      onClose={onDismiss}
      padding={0}
    >
      <ContentWrapper>
        <HeaderContent>
          <Flex width="100%" row justifyContent="space-between">
            <Text variant="body2">{t('common.selectRegion.label')}</Text>
            <ModalCloseIcon testId="CountryListModal-close" onClose={closeModal} />
          </Flex>
          <Flex position="relative" height="100%" flex={1}>
            <SearchIcon
              fill={colors.neutral3.val}
              style={{ position: 'absolute', left: '12px', top: '10px' }}
              width={iconSizes.icon20}
              height={iconSizes.icon20}
              pointerEvents="none"
            />
            <SearchInput
              type="text"
              id="for-country-search-input"
              data-testid="for-country-search-input"
              placeholder={t`swap.buy.countryModal.placeholder`}
              autoComplete="off"
              value={searchQuery}
              onChange={handleInput}
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
