import { ScrollBarStyles } from 'components/Common/styles'
import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import { HeaderContent } from 'pages/Swap/Buy/CountryListModal'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { CloseIcon } from 'theme/components'
import { Flex } from 'ui/src'
import { Text } from 'ui/src/components/text/Text'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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
  const { t } = useTranslation()
  return (
    <Modal
      name={ModalName.FiatOnRampTokenSelector}
      maxWidth={420}
      height={700}
      maxHeight={700}
      isModalOpen={isOpen}
      onClose={onDismiss}
      padding={0}
    >
      <ContentWrapper>
        <HeaderContent>
          <Flex row justifyContent="space-between">
            <Text variant="subheading1">{t('common.selectToken.label')}</Text>
            <CloseIcon data-testid="FiatOnRampCurrencyModal-close" onClick={onDismiss} />
          </Flex>
        </HeaderContent>
        <Flex grow>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <div data-testid="for-currency-list-wrapper">
                <FixedSizeList
                  height={height}
                  width="100%"
                  itemData={currencies}
                  itemCount={currencies.length}
                  itemSize={ROW_ITEM_SIZE}
                  itemKey={(index: number, data: typeof currencies) => data[index]?.meldCurrencyCode ?? index}
                  {...ScrollBarStyles}
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
        </Flex>
      </ContentWrapper>
    </Modal>
  )
}
