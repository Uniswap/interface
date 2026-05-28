import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { SettingsListModal } from 'src/components/Settings/lists/SettingsListModal'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { getFiatCurrencyCode, getFiatCurrencyName, useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { setCurrentFiatCurrency } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export function SettingsFiatCurrencyModal(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const selectedCurrency = useAppFiatCurrency()

  const getCurrencyTitle = useEvent((currency: FiatCurrency) => {
    return getFiatCurrencyName(t, currency).name
  })

  const getCurrencyCode = useEvent((currency: FiatCurrency) => {
    return getFiatCurrencyCode(currency)
  })

  const onSelectCurrencyOption = useEvent(async (currency: FiatCurrency) => {
    dispatch(setCurrentFiatCurrency(currency))
  })

  return (
    <SettingsListModal
      modalName={ModalName.FiatCurrencySelector}
      title={t('settings.setting.currency.title')}
      selectedItem={selectedCurrency}
      options={ORDERED_CURRENCIES}
      getItemTitle={getCurrencyTitle}
      getItemSubtitle={getCurrencyCode}
      onSelectItem={onSelectCurrencyOption}
    />
  )
}
