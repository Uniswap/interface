import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { scrollbarStyle } from 'components/SearchModal/CurrencyList/index.css'
import { PaddedColumn, SearchInput } from 'components/SearchModal/styled'
import { t } from 'i18next'
import { CountryListRow } from 'pages/Swap/Buy/CountryListRow'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { CloseIcon } from 'theme/components'
import { Text } from 'ui/src/components/text/Text'
import { FORCountry } from 'uniswap/src/features/fiatOnRamp/types'
import { bubbleToTop } from 'utilities/src/primitives/array'

const ROW_ITEM_SIZE = 56

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
    <Modal isOpen={isOpen} onDismiss={closeModal} height="90vh" maxHeight={700}>
      <ContentWrapper>
        <PaddedColumn gap="md">
          <RowBetween>
            <Text variant="body3">
              <Trans i18nKey="common.selectRegion.label" />
            </Text>
            <CloseIcon data-testid="CountryListModal-close" onClick={closeModal} />
          </RowBetween>
          <SearchInput
            type="text"
            id="for-country-search-input"
            data-testid="for-country-search-input"
            placeholder={t`Search by country or region`}
            autoComplete="off"
            value={searchQuery}
            onChange={handleInput}
          />
        </PaddedColumn>
        <div style={{ flex: '1' }}>
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
        </div>
      </ContentWrapper>
    </Modal>
  )
}
