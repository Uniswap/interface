import { t, Trans } from '@lingui/macro'
import styled, { icon, Theme, ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { ChevronDown } from 'react-feather'

import Button from '../Button'
import Row from '../Row'

const StyledTokenButton = styled(Button)<{ empty?: boolean; theme: Theme }>`
  border-radius: ${({ theme }) => theme.borderRadius}em;
  padding: 0.25em;
  padding-left: ${({ empty }) => (empty ? 0.75 : 0.25)}em;

  img {
    border-radius: 100%;
    height: 1.2em;
    width: 1.2em;
  }
`

const TokenButtonRow = styled(Row)<{ collapsed: boolean }>`
  height: 1.2em;
  max-width: ${({ collapsed }) => (collapsed ? '1.2' : '8')}em;
  overflow-x: hidden;
  transition: max-width 0.2s;
`

const ChevronDownIcon = styled(icon(ChevronDown, { color: 'onInteractive' }))`
  stroke-width: 3;
`

interface TokenButtonProps {
  value?: Token
  collapsed: boolean
  onClick: () => void
}

export default function TokenButton({ value, collapsed, onClick }: TokenButtonProps) {
  return (
    <StyledTokenButton onClick={onClick} empty={!value} color={value ? 'interactive' : 'accent'}>
      <ThemedText.ButtonLarge color="onInteractive">
        <TokenButtonRow gap={0.4} collapsed={Boolean(value) && collapsed}>
          {value ? (
            <>
              <img src={value.logoURI} alt={t`${value.name || value.symbol} logo`} />
              {value.symbol}
            </>
          ) : (
            <Trans>Select a token</Trans>
          )}
          <ChevronDownIcon />
        </TokenButtonRow>
      </ThemedText.ButtonLarge>
    </StyledTokenButton>
  )
}
