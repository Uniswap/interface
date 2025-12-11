import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn, MenuItem } from 'components/AccountDrawer/shared'
import { getLocalCurrencyIcon } from 'constants/localCurrencies'
import { useLocalCurrencyLinkProps } from 'hooks/useLocalCurrencyLinkProps'
import { deprecatedStyled } from 'lib/styled-components'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'

const StyledLocalCurrencyIcon = deprecatedStyled.div`
  width: 20px;
  height: 20px;
  border-radius: 100%;
  overflow: hidden;
`

function LocalCurrencyMenuItem({ localCurrency, isActive }: { localCurrency: FiatCurrency; isActive: boolean }) {
  const { to, onClick } = useLocalCurrencyLinkProps(localCurrency)

  const LocalCurrencyIcon = useMemo(() => {
    return <StyledLocalCurrencyIcon>{getLocalCurrencyIcon(localCurrency)}</StyledLocalCurrencyIcon>
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
