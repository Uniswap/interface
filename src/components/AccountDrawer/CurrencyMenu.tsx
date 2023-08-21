import { Trans } from '@lingui/macro'
import { SUPPORTED_CURRENCIES } from 'constants/currencies'
import { useActiveCurrency } from 'hooks/useActiveCurrency'

import { MenuItem } from './shared'
import { SlideOutMenu } from './SlideOutMenu'

function CurrencyMenuItems() {
  const activeCurrency = useActiveCurrency()

  return (
    <>
      {SUPPORTED_CURRENCIES.map((currency) => (
        <MenuItem label={currency} isActive={activeCurrency === currency} key={currency} />
      ))}
    </>
  )
}

export default function CurrencyMenu({ onClose }: { onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans>Currency</Trans>} onClose={onClose}>
      <CurrencyMenuItems />
    </SlideOutMenu>
  )
}
