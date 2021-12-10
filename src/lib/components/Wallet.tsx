import { CreditCard } from 'lib/icons'
import { ThemedText } from 'lib/theme'

import Row from './Row'

export default function Wallet({ disabled }: { disabled?: boolean }) {
  return disabled ? (
    <ThemedText.Caption color="secondary">
      <Row gap={0.25}>
        <CreditCard />
        Connect wallet to swap
      </Row>
    </ThemedText.Caption>
  ) : null
}
