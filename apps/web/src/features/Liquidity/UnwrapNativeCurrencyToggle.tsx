import type { Currency } from '@uniswap/sdk-core'
import { Flex, Switch, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

/**
 * The "Add as ETH" row under a deposit input for a v2/v3 wrapped-native leg. On, the deposit is funded
 * from the native currency and wrapped inside the transaction; off, from the wrapped token the pool holds.
 * Shared by the increase-liquidity modal and the create/add-liquidity deposit step.
 */
export function UnwrapNativeCurrencyToggle({
  nativeCurrency,
  checked,
  onCheckedChange,
}: {
  nativeCurrency: Currency
  checked: boolean
  onCheckedChange: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex row justifyContent="space-between" alignItems="center">
      <Text variant="body3" color="$neutral2">
        {t('pool.addAs', { nativeWrappedSymbol: nativeCurrency.symbol ?? t('common.token') })}
      </Text>
      <Switch id="add-as-weth" checked={checked} onCheckedChange={onCheckedChange} variant="branded" />
    </Flex>
  )
}
