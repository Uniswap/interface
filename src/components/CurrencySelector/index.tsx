import { Currency } from '@uniswap/sdk-core'
import React, { ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { DropdownWithSearch } from 'src/components/CurrencySelector/Dropdown'
import { Toggle } from 'src/components/CurrencySelector/Toggle'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'

interface CurrencySelectorProps {
  currencies: Partial<Record<ChainId, Record<string, Currency>>>
  onSelectCurrency: ComponentProps<typeof DropdownWithSearch>['onSelectCurrency']
  selectedCurrency: Currency | null | undefined
  // TODO:
  //  - otherSelectCurrency (to hide)
}

export function CurrencySelector({
  onSelectCurrency,
  currencies,
  selectedCurrency,
}: CurrencySelectorProps) {
  const [modalVisible, setModalVisible] = useState(false)

  const { t } = useTranslation()

  const hideModal = () => setModalVisible(false)

  return (
    <Box>
      <Modal
        title={t`Select input`}
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        hide={hideModal}
        onRequestClose={hideModal}>
        <DropdownWithSearch
          currencies={currencies}
          onSelectCurrency={(currency: Currency) => {
            onSelectCurrency(currency)
            hideModal()
          }}
        />
      </Modal>
      <Toggle
        onToggle={() => {
          setModalVisible(!modalVisible)
        }}
        filled={!selectedCurrency}>
        {selectedCurrency ? (
          <CenterBox flexDirection="row">
            <CurrencyLogo currency={selectedCurrency} size={20} />
            <CenterBox flexDirection="row" marginHorizontal="sm">
              <Text variant="h3" color="black" mr="sm">
                {selectedCurrency.symbol}
              </Text>
              <Text variant="body" color="black">
                {selectedCurrency.chainId}
              </Text>
            </CenterBox>
          </CenterBox>
        ) : (
          <Text variant="body" color="white">{t`Select a token`}</Text>
        )}
      </Toggle>
    </Box>
  )
}
