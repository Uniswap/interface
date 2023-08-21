import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { SUPPORTED_CURRENCIES, SupportedCurrency } from 'constants/currencies'
import { useActiveCurrency } from 'hooks/useActiveCurrency'
import { useCurrencyLinkProps } from 'hooks/useCurrencyLinkProps'

import { MenuItem } from './shared'
import { SlideOutMenu } from './SlideOutMenu'

function CurrencyMenuItem({ currency, isActive }: { currency: SupportedCurrency; isActive: boolean }) {
  const { to, onClick } = useCurrencyLinkProps(currency)

  if (!to) return null

  return <MenuItem label={currency} isActive={isActive} to={to} onClick={onClick} />
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
