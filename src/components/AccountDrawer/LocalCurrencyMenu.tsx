import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { getLocalCurrencyIcon, SUPPORTED_LOCAL_CURRENCIES, SupportedLocalCurrency } from 'constants/localCurrencies'
import { useActiveLocalCurrency } from 'hooks/useLocalActiveCurrency'
import { useLocalCurrencyLinkProps } from 'hooks/useLocalCurrencyLinkProps'
import { useMemo } from 'react'
import styled from 'styled-components'

import { MenuItem } from './shared'
import { SlideOutMenu } from './SlideOutMenu'

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

  if (!to) return null

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

export default function LocalCurrencyMenu({ onClose }: { onClose: () => void }) {
  const activeLocalCurrency = useActiveLocalCurrency()

  return (
    <SlideOutMenu title={<Trans>Currency</Trans>} onClose={onClose}>
      <Column>
        {SUPPORTED_LOCAL_CURRENCIES.map((localCurrency) => (
          <LocalCurrencyMenuItem
            localCurrency={localCurrency}
            isActive={activeLocalCurrency === localCurrency}
            key={localCurrency}
          />
        ))}
      </Column>
    </SlideOutMenu>
  )
}
