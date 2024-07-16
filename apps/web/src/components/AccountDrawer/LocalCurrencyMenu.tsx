import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn, MenuItem } from 'components/AccountDrawer/shared'
import { SUPPORTED_LOCAL_CURRENCIES, SupportedLocalCurrency, getLocalCurrencyIcon } from 'constants/localCurrencies'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useLocalCurrencyLinkProps } from 'hooks/useLocalCurrencyLinkProps'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { useMemo } from 'react'

const StyledLocalCurrencyIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 100%;
  overflow: hidden;
`

function LocalCurrencyMenuItem({
  localCurrency,
  isActive,
}: {
  localCurrency: SupportedLocalCurrency
  isActive: boolean
}) {
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
  const activeLocalCurrency = useActiveLocalCurrency()

  return (
    <>
      {SUPPORTED_LOCAL_CURRENCIES.map((localCurrency) => (
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
