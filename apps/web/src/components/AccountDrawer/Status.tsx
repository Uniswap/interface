import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import StatusIcon from 'components/Identicon/StatusIcon'
import styled from 'lib/styled-components'
import { ThemedText } from 'theme/components'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Text } from 'ui/src'
import { shortenAddress } from 'utilities/src/addresses'

const Container = styled.div`
  display: flex;
  padding-right: 8px;
`
const Identifiers = styled.div`
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 8px;
  user-select: none;
  overflow: hidden;
  flex: 1 1 auto;
`

export function Status({
  account,
  ensUsername,
  uniswapUsername,
  showAddressCopy = true,
}: {
  account: string
  ensUsername?: string | null
  uniswapUsername?: string
  showAddressCopy?: boolean
}) {
  return (
    <Container data-testid="account-drawer-status">
      <StatusIcon size={40} />
      <Identifiers>
        <ThemedText.SubHeader>
          <AddressDisplay enableCopyAddress={showAddressCopy} address={account} />
        </ThemedText.SubHeader>
        {(uniswapUsername || ensUsername) && (
          <CopyHelper iconSize={14} iconPosition="right" toCopy={account}>
            <Text variant="body4" color="neutral2">
              {shortenAddress(account)}
            </Text>
          </CopyHelper>
        )}
      </Identifiers>
    </Container>
  )
}
