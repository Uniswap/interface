import { Trans } from '@lingui/macro'
import { Wallet as WalletIcon } from 'lib/icons'
import { ThemedText } from 'lib/theme'

import { TextButton } from './Button'
import Row from './Row'

interface WalletProps {
  disabled?: boolean
  onClick?: () => void
}

export default function Wallet({ disabled, onClick }: WalletProps) {
  return disabled ? (
    <TextButton disabled={!onClick} onClick={onClick} color="secondary" style={{ filter: 'none' }}>
      <ThemedText.Caption>
        <Row gap={0.5}>
          <WalletIcon />
          <Trans>Connect your wallet</Trans>
        </Row>
      </ThemedText.Caption>
    </TextButton>
  ) : null
}
