import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Action } from 'redux'
import { useAppDispatch } from 'src/app/hooks'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { closeModal } from 'src/features/modals/modalSlice'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { FiatCurrency, ORDERED_CURRENCIES } from 'wallet/src/features/fiatCurrency/constants'
import { useAppFiatCurrency, useFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { setCurrentFiatCurrency } from 'wallet/src/features/fiatCurrency/slice'
import { ModalName } from 'wallet/src/telemetry/constants'

export function SettingsFiatCurrencyModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  return (
    <BottomSheetModal
      fullScreen
      name={ModalName.FiatCurrencySelector}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.FiatCurrencySelector }))}>
      <Text pb="$spacing12" textAlign="center" variant="subheading1">
        {t('settings.setting.currency.title')}
      </Text>
      <VirtualizedList showsVerticalScrollIndicator={false}>
        <FiatCurrencySelection
          onClose={(): void => {
            dispatch(closeModal({ name: ModalName.FiatCurrencySelector }))
          }}
        />
      </VirtualizedList>
    </BottomSheetModal>
  )
}

function FiatCurrencySelection({ onClose }: { onClose: () => void }): JSX.Element {
  const selectedCurrency = useAppFiatCurrency()

  return (
    <Flex pb="$spacing32" px="$spacing16">
      {ORDERED_CURRENCIES.map((currency) => (
        <FiatCurrencyOption
          active={selectedCurrency === currency}
          currency={currency}
          onPress={onClose}
        />
      ))}
    </Flex>
  )
}

interface FiatCurrencyOptionProps {
  active?: boolean
  currency: FiatCurrency
  onPress: () => void
}

function FiatCurrencyOption({ active, currency, onPress }: FiatCurrencyOptionProps): JSX.Element {
  const dispatch = useAppDispatch()
  const colors = useSporeColors()
  const { name, code } = useFiatCurrencyInfo(currency)

  const changeCurrency = useCallback(() => {
    dispatch(setCurrentFiatCurrency(currency))
    onPress()
  }, [dispatch, onPress, currency])

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      px="$spacing12"
      py="$spacing12"
      onPress={changeCurrency}>
      <Flex row gap="$spacing12">
        <Flex grow row gap="$spacing12">
          <Text variant="subheading1">{name}</Text>
          <Text color="$neutral3" variant="body1">
            {code}
          </Text>
        </Flex>
        {active && <Icons.Check color={colors.accent1.val} size="$icon.24" />}
      </Flex>
    </TouchableArea>
  )
}
