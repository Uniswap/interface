import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, TextProps, TouchableArea } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useTokenAndFiatDisplayAmounts } from 'uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { CurrencyField } from 'uniswap/src/types/currency'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface CurrencyInputPanelValueProps {
  disabled: boolean
  value: string | undefined
  usdValue: Maybe<CurrencyAmount<Currency>>
  onPressDisabledWithShakeAnimation: () => void
  onToggleIsFiatMode: (currencyField: CurrencyField) => void
  currencyField: CurrencyField
  currencyInfo: Maybe<CurrencyInfo>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  isFiatMode: boolean
  fiatValueVariant?: TextProps['variant']
}

export const CurrencyInputPanelValue = memo(function _CurrencyInputPanelValue({
  disabled,
  value,
  usdValue,
  onPressDisabledWithShakeAnimation,
  onToggleIsFiatMode,
  currencyField,
  currencyInfo,
  currencyAmount,
  isFiatMode,
  fiatValueVariant = 'body3',
}: CurrencyInputPanelValueProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { price: usdPrice } = useUSDCPrice(currencyInfo?.currency)
  const { code: fiatCurrencyCode } = useAppFiatCurrencyInfo()
  const _onToggleIsFiatMode = useCallback(() => {
    if (!usdPrice) {
      dispatch(
        pushNotification({
          type: AppNotificationType.Error,
          errorMessage: t('swap.error.fiatInputUnavailable', { fiatCurrencyCode }),
          hideDelay: ONE_SECOND_MS * 3,
        }),
      )
    } else {
      onToggleIsFiatMode(currencyField)
    }
  }, [currencyField, dispatch, fiatCurrencyCode, onToggleIsFiatMode, t, usdPrice])
  // In fiat mode, show equivalent token amount. In token mode, show equivalent fiat amount
  const inputPanelFormattedValue = useTokenAndFiatDisplayAmounts({
    value,
    currencyInfo,
    currencyAmount,
    usdValue,
    isFiatMode,
  })
  return (
    <TouchableArea
      group="item"
      flexShrink={1}
      onPress={disabled || isTestnetModeEnabled ? onPressDisabledWithShakeAnimation : _onToggleIsFiatMode}
    >
      {!isTestnetModeEnabled && (
        <Flex centered row shrink gap="$spacing4" width="max-content">
          <Text
            color="$neutral2"
            $group-item-hover={{ color: '$neutral2Hovered' }}
            numberOfLines={1}
            variant={fiatValueVariant}
          >
            {inputPanelFormattedValue}
          </Text>
        </Flex>
      )}
    </TouchableArea>
  )
})
