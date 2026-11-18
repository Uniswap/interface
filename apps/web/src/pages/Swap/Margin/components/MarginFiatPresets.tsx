import { useTranslation } from 'react-i18next'
import {
  AmountInputPresets,
  PRESET_BUTTON_PROPS,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetPill } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetPill'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

const PRESETS: (number | 'max')[] = [100, 500, 1000, 'max']

// Dollar quick-selects in place of the panel's balance-share presets: the deposit is restated from the
// pay token, so "25%" of one token's balance was the wrong unit. Same hover reveal and pill as Swap's.
export function MarginFiatPresets({
  canEnterFiat,
  canMax,
  onSelectFiat,
  onSelectMax,
}: {
  canEnterFiat: boolean
  canMax: boolean
  // An amount in the app's fiat currency, as the pill labels it.
  onSelectFiat: (amount: number) => void
  onSelectMax: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { addFiatSymbolToNumber } = useLocalizationContext()
  const { code, symbol } = useAppFiatCurrencyInfo()
  return (
    <AmountInputPresets
      presets={PRESETS}
      renderPreset={(preset) =>
        preset === 'max' ? (
          <PresetPill {...PRESET_BUTTON_PROPS} disabled={!canMax} onPress={onSelectMax}>
            {t('common.max')}
          </PresetPill>
        ) : (
          <PresetPill {...PRESET_BUTTON_PROPS} disabled={!canEnterFiat} onPress={() => onSelectFiat(preset)}>
            {String(
              addFiatSymbolToNumber({
                value: preset >= 1000 ? `${preset / 1000}K` : String(preset),
                currencyCode: code,
                currencySymbol: symbol,
              }),
            )}
          </PresetPill>
        )
      }
    />
  )
}
