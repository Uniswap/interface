import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
// TODO(WALL-7189): Explore removing FlatList.  Currently using this to fix a scrolling regression.
import { FlatList } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { setCurrentFiatCurrency } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function SettingsFiatCurrencyModal(): JSX.Element {
  const { t } = useTranslation()
  const selectedCurrency = useAppFiatCurrency()
  const { onClose } = useReactNavigationModal()

  // render
  const renderItem = useCallback(
    ({ item: currency }: { item: FiatCurrency }) => (
      <FiatCurrencyOption active={selectedCurrency === currency} currency={currency} onPress={onClose} />
    ),
    [selectedCurrency, onClose],
  )

  return (
    <Modal fullScreen name={ModalName.FiatCurrencySelector} onClose={onClose}>
      <Text pb="$spacing12" textAlign="center" variant="subheading1">
        {t('settings.setting.currency.title')}
      </Text>
      {/* When modifying this component, please test on a physical device that 
          scrolling the currencies list continues to work correctly. */}
      <FlatList
        data={ORDERED_CURRENCIES}
        keyExtractor={(item: FiatCurrency) => item}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      />
    </Modal>
  )
}

interface FiatCurrencyOptionProps {
  active?: boolean
  currency: FiatCurrency
  onPress: () => void
}

function FiatCurrencyOption({ active, currency, onPress }: FiatCurrencyOptionProps): JSX.Element {
  const dispatch = useDispatch()
  const { name, code } = useFiatCurrencyInfo(currency)

  const changeCurrency = useCallback(() => {
    dispatch(setCurrentFiatCurrency(currency))
    onPress()
  }, [dispatch, onPress, currency])

  return (
    <TouchableArea alignItems="center" flexDirection="row" px="$spacing12" py="$spacing12" onPress={changeCurrency}>
      <Flex row gap="$spacing12">
        <Flex grow row gap="$spacing12">
          <Text variant="subheading1">{name}</Text>
          <Text color="$neutral3" variant="body1">
            {code}
          </Text>
        </Flex>
        {active && <Check color="$accent1" size="$icon.24" />}
      </Flex>
    </TouchableArea>
  )
}
