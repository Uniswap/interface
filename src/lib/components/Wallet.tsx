import { CreditCard } from 'lib/icons'
import { ThemedText } from 'lib/theme'

import Row from './Row'

const mockConnected = false

export default function Wallet() {
  const connected = mockConnected
  return connected ? null : (
    <ThemedText.Caption userSelect="none" color="secondary">
      <Row gap={0.25}>
        <CreditCard />
        Connect wallet to swap
      </Row>
    </ThemedText.Caption>
  )
}
