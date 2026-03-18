import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { MenuColumn, MenuItem } from '~/components/AccountDrawer/shared'
import { getLocalCurrencyIcon } from '~/constants/localCurrencies'
import { useLocalCurrencyLinkProps } from '~/hooks/useLocalCurrencyLinkProps'

function LocalCurrencyMenuItem({ localCurrency, isActive }: { localCurrency: FiatCurrency; isActive: boolean }) {
  const { to, onClick } = useLocalCurrencyLinkProps(localCurrency)

  const LocalCurrencyIcon = useMemo(() => {
    return (
      <Flex width={iconSizes.icon20} height={iconSizes.icon20} borderRadius="$roundedFull" overflow="hidden">
        {getLocalCurrencyIcon(localCurrency)}
      </Flex>
    )
  }, [localCurrency])

  if (!to) {
    return null
  }

  return (
    <MenuItem
      label={localCurrency}
      logo={LocalCurrencyIcon}
      isActive={isActive}
      to={to}
      onClick={onClick}
      testId="wallet-local-currency-item"
    />
  )
}

export function LocalCurrencyMenuItems() {
  const activeLocalCurrency = useAppFiatCurrency()

  return (
    <>
      {ORDERED_CURRENCIES.map((localCurrency) => (
        <LocalCurrencyMenuItem
          localCurrency={localCurrency}
          isActive={activeLocalCurrency === localCurrency}
          key={localCurrency}
        />
      ))}
    </>
  )
}

export default function LocalCurrencyMenu({ onClose }: { onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans i18nKey="common.currency" />} onClose={onClose}>
      <MenuColumn>
        <LocalCurrencyMenuItems />
      </MenuColumn>
    </SlideOutMenu>
  )
}
