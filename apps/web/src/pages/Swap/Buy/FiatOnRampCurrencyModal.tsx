import { CurrencyRow } from 'components/SearchModal/CurrencyList'
import { HeaderContent } from 'pages/Swap/Buy/CountryListModal'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { CSSProperties, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'
import { Flex, ModalCloseIcon, useMedia, useScrollbarStyles } from 'ui/src'
import { Text } from 'ui/src/components/text/Text'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

import { DropdownController } from 'components/swap/SwapDetails'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'

const ROW_ITEM_SIZE = 56

interface FiatOnRampCurrencyModalProps {
  isOpen: boolean
  onDismiss: () => void
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  selectedCurrency?: FiatOnRampCurrency
  currencies: FiatOnRampCurrency[]
  unsupportedCurrencies: FiatOnRampCurrency[]
}

export function FiatOnRampCurrencyModal({
  isOpen,
  onDismiss,
  currencies,
  unsupportedCurrencies,
  selectedCurrency,
  onSelectCurrency,
}: FiatOnRampCurrencyModalProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()
  const { setBuyFormState } = useBuyFormContext()

  const [expanded, setExpanded] = useState(true)
  const getItemSize = useCallback(
    (index: number) => {
      if (index === currencies.length) {
        return 40
      }

      return ROW_ITEM_SIZE
    },
    [currencies.length],
  )

  const [items, separatorIndex] = useMemo(() => {
    let _separatorIndex = -1
    let _items: (FiatOnRampCurrency | null)[] = [...currencies]
    if (unsupportedCurrencies.length > 0) {
      _separatorIndex = currencies.length
      _items = _items.concat(null)
    }
    if (expanded) {
      _items = _items.concat(unsupportedCurrencies)
    }
    return [_items, _separatorIndex]
  }, [currencies, expanded, unsupportedCurrencies])

  return (
    <Modal
      name={ModalName.FiatOnRampTokenSelector}
      maxWidth={420}
      height={media.sm ? '100vh' : '100%'}
      maxHeight={700}
      isModalOpen={isOpen}
      onClose={onDismiss}
      padding={0}
    >
      <ContentWrapper>
        <HeaderContent>
          <Flex row justifyContent="space-between">
            <Text variant="subheading1">{t('common.selectToken.label')}</Text>
            <ModalCloseIcon testId="FiatOnRampCurrencyModal-close" onClose={onDismiss} />
          </Flex>
        </HeaderContent>
        <Flex grow>
          <AutoSizer disableWidth>
            {({ height }: { height: number }) => (
              <Flex data-testid="for-currency-list-wrapper">
                <List
                  height={height}
                  width="100%"
                  itemData={items}
                  itemCount={items.length}
                  itemSize={getItemSize}
                  itemKey={(index: number, data: typeof items) => data[index]?.meldCurrencyCode ?? index}
                  style={scrollbarStyles}
                >
                  {({
                    style,
                    data,
                    index,
                  }: {
                    data: (FiatOnRampCurrency | null)[]
                    index: number
                    style: CSSProperties
                  }) => {
                    if (index === separatorIndex) {
                      return (
                        <Flex style={{ ...style }}>
                          <DropdownController
                            open={expanded}
                            onClick={() => {
                              setExpanded((expanded) => !expanded)
                            }}
                          >
                            {t('fiatOffRamp.unsupportedToken.divider')}
                          </DropdownController>
                        </Flex>
                      )
                    }

                    const currencyInfo = data[index]?.currencyInfo
                    if (!currencyInfo) {
                      return null
                    }

                    return (
                      <CurrencyRow
                        style={style}
                        currencyInfo={currencyInfo}
                        showUsdValue
                        showCurrencyAmount
                        onSelect={() => {
                          const currency = data[index]
                          if (!currency) {
                            return
                          }

                          if (currencies.includes(currency)) {
                            onSelectCurrency(currency)
                            onDismiss()
                          } else {
                            setBuyFormState((state) => ({ ...state, selectedUnsupportedCurrency: currency }))
                          }
                        }}
                        isSelected={selectedCurrency?.meldCurrencyCode === data[index]?.meldCurrencyCode}
                        eventProperties={{}}
                        otherSelected={false}
                      />
                    )
                  }}
                </List>
              </Flex>
            )}
          </AutoSizer>
        </Flex>
      </ContentWrapper>
    </Modal>
  )
}
