import { Flex, iconSizes } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalCurrencyLinkProps } from '~/features/wallet/components/AccountDrawer/hooks/useLocalCurrencyLinkProps'
import { getLocalCurrencyIcon } from '~/features/wallet/components/AccountDrawer/LocalCurrency/localCurrencies'
import { MenuColumn, MenuItem } from '~/features/wallet/components/AccountDrawer/shared'
import { SlideOutMenu } from '~/features/wallet/components/AccountDrawer/SlideOutMenu'

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
      testId={TestID.WalletLocalCurrencyItem}
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

export function LocalCurrencyMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <SlideOutMenu title={t('common.currency')} onClose={onClose}>
      <MenuColumn>
        <LocalCurrencyMenuItems />
      </MenuColumn>
    </SlideOutMenu>
  )
}
