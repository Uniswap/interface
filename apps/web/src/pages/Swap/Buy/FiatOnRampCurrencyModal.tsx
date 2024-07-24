import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import { scrollbarStyle } from 'components/SearchModal/CurrencyList/index.css'
import { PaddedColumn } from 'components/SearchModal/styled'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { CSSProperties } from 'react'
import { Trans } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { CloseIcon } from 'theme/components'
import { Text } from 'ui/src/components/text/Text'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'

const ROW_ITEM_SIZE = 56

interface FiatOnRampCurrencyModalProps {
  isOpen: boolean
  onDismiss: () => void
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  selectedCurrency?: FiatOnRampCurrency
  currencies: FiatOnRampCurrency[]
}

export function FiatOnRampCurrencyModal({
  isOpen,
  onDismiss,
  currencies,
  selectedCurrency,
  onSelectCurrency,
}: FiatOnRampCurrencyModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} height="90vh" maxHeight={700}>
      <ContentWrapper>
        <PaddedColumn>
          <RowBetween>
            <Text variant="subheading1">
              <Trans i18nKey="common.selectToken.label" />
            </Text>
            <CloseIcon data-testid="FiatOnRampCurrencyModal-close" onClick={onDismiss} />
          </RowBetween>
        </PaddedColumn>
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <div data-testid="for-currency-list-wrapper">
                <FixedSizeList
                  className={scrollbarStyle}
                  height={height}
                  width="100%"
                  itemData={currencies}
                  itemCount={currencies.length}
                  itemSize={ROW_ITEM_SIZE}
                  itemKey={(index: number, data: typeof currencies) => data[index]?.meldCurrencyCode ?? index}
                >
                  {({ style, data, index }: { data: FiatOnRampCurrency[]; index: number; style: CSSProperties }) => {
                    const currencyInfo = data[index].currencyInfo
                    if (!currencyInfo) {
                      return null
                    }
                    return (
                      <CurrencyRow
                        style={style}
                        currency={currencyInfo.currency}
                        onSelect={() => {
                          onSelectCurrency(data[index])
                          onDismiss()
                        }}
                        isSelected={selectedCurrency?.meldCurrencyCode === data[index].meldCurrencyCode}
                        eventProperties={{}}
                        otherSelected={false}
                      />
                    )
                  }}
                </FixedSizeList>
              </div>
            )}
          </AutoSizer>
        </div>
      </ContentWrapper>
    </Modal>
  )
}
