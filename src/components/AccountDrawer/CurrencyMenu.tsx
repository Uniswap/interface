import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { getCurrencyIcon, SUPPORTED_CURRENCIES, SupportedCurrency } from 'constants/currencies'
import { useActiveCurrency } from 'hooks/useActiveCurrency'
import { useCurrencyLinkProps } from 'hooks/useCurrencyLinkProps'
import { useMemo } from 'react'
import styled from 'styled-components'

import { MenuItem } from './shared'
import { SlideOutMenu } from './SlideOutMenu'

const StyledCurrencyIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 100%;
  overflow: hidden;
`

function CurrencyMenuItem({ currency, isActive }: { currency: SupportedCurrency; isActive: boolean }) {
  const { to, onClick } = useCurrencyLinkProps(currency)

  const CurrencyIcon = useMemo(() => {
    return <StyledCurrencyIcon>{getCurrencyIcon(currency)}</StyledCurrencyIcon>
  }, [currency])

  if (!to) return null

  return (
    <MenuItem
      label={currency}
      logo={CurrencyIcon}
      isActive={isActive}
      to={to}
      onClick={onClick}
      testId="wallet-currency-item"
    />
  )
}

export default function CurrencyMenu({ onClose }: { onClose: () => void }) {
  const activeCurrency = useActiveCurrency()

  return (
    <SlideOutMenu title={<Trans>Currency</Trans>} onClose={onClose}>
      <Column>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <CurrencyMenuItem currency={currency} isActive={activeCurrency === currency} key={currency} />
        ))}
      </Column>
    </SlideOutMenu>
  )
}
