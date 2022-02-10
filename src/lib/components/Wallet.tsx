import { Trans } from '@lingui/macro'
import { Wallet as WalletIcon } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'

import Row from './Row'

interface WalletProps {
  disabled?: boolean
  onClick?: () => void
}

const ClickableRow = styled(Row)<{ onClick?: unknown }>`
  cursor: ${({ onClick }) => onClick && 'pointer'};
`

export default function Wallet({ disabled, onClick }: WalletProps) {
  return disabled ? (
    <ThemedText.Caption color="secondary">
      <ClickableRow gap={0.5} onClick={onClick}>
        <WalletIcon />
        <Trans>Connect your wallet</Trans>
      </ClickableRow>
    </ThemedText.Caption>
  ) : null
}
