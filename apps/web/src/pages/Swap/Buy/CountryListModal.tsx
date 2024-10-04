import { scrollbarStyle } from 'components/SearchModal/CurrencyList/index.css'
import { SearchInput } from 'components/SearchModal/styled'
import { CountryListRow } from 'pages/Swap/Buy/CountryListRow'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { CloseIcon } from 'theme/components'
import { AdaptiveWebModal, Flex, styled } from 'ui/src'
import { Text } from 'ui/src/components/text/Text'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { useTranslation } from 'uniswap/src/i18n'
import { INTERFACE_NAV_HEIGHT } from 'uniswap/src/theme/heights'
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

  const filteredData: FORCountry[] = useMemo(() => {
    const sorted = bubbleToTop(countryList, (c) => c.countryCode === selectedCountry?.countryCode)
    if (searchQuery) {
      return sorted.filter((item) => item?.displayName.toLowerCase().startsWith(searchQuery.toLowerCase()))
    } else {
      return sorted
    }
  }, [countryList, searchQuery, selectedCountry?.countryCode])

  const fixedList = useRef<FixedSizeList>()
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
    <AdaptiveWebModal
      p={0}
      isOpen={isOpen}
      flex={1}
      onClose={closeModal}
      maxHeight={700}
      $sm={{ height: `calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)` }}
    >
      <ContentWrapper>
        <HeaderContent>
          <Flex width="100%" row justifyContent="space-between">
            <Text variant="body2">{t('common.selectRegion.label')}</Text>
            <CloseIcon data-testid="CountryListModal-close" onClick={closeModal} />
          </Flex>
          <SearchInput
            type="text"
            id="for-country-search-input"
            data-testid="for-country-search-input"
            placeholder={t`swap.buy.countryModal.placeholder`}
            autoComplete="off"
            value={searchQuery}
            onChange={handleInput}
          />
        </HeaderContent>
        <Flex grow>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <div data-testid="country-list-wrapper">
                <FixedSizeList
                  className={scrollbarStyle}
                  height={height}
                  ref={fixedList as any}
                  width="100%"
                  itemData={filteredData}
                  itemCount={filteredData.length}
                  itemSize={ROW_ITEM_SIZE}
                  itemKey={(index: number, data: typeof countryList) => data[index]?.countryCode}
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
              </div>
            )}
          </AutoSizer>
        </Flex>
      </ContentWrapper>
    </AdaptiveWebModal>
  )
}
