import { Trans } from '@lingui/macro'
import { Wallet as WalletIcon } from 'lib/icons'
import { ThemedText } from 'lib/theme'

import Row from './Row'

export default function Wallet({ disabled }: { disabled?: boolean }) {
  return disabled ? (
    <ThemedText.Caption color="secondary">
      <Row gap={0.5}>
        <WalletIcon />
        <Trans>Connect your wallet</Trans>
      </Row>
    </ThemedText.Caption>
  ) : null
}
