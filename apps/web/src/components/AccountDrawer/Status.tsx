import { AddressDisplay } from 'components/AccountDetails/AddressDisplay'
import { ENS } from 'components/Icons/ENS'
import { EthMini } from 'components/Icons/EthMini'
import StatusIcon from 'components/Identicon/StatusIcon'
import Popover from 'components/Popover'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import styled from 'lib/styled-components'
import { useRef, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import { ClickableStyle, CopyHelper, ThemedText } from 'theme/components'
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
const SecondaryIdentifiersContainer = styled(Row)`
  position: relative;
  user-select: none;
  :hover > div > #more-identifiers-icon {
    display: inline-block;
  }
`
const MoreIcon = styled(MoreHorizontal)`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral2};
  cursor: pointer;
  ${ClickableStyle}
`
const Dropdown = styled(Column)`
  width: 240px;
  gap: 2px;
  padding: 8px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  background: ${({ theme }) => theme.surface1};
`
const EnsIcon = styled(ENS)`
  height: 20px;
  width: 20px;
  padding: 2px 3px;
`

function SecondaryIdentifier({
  Icon,
  displayValue,
  copyValue,
}: {
  Icon: React.ComponentType
  displayValue: string
  copyValue: string
}) {
  return (
    <CopyHelper iconSize={20} iconPosition="right" toCopy={copyValue}>
      <Row width="240px" padding="8px 4px">
        <Icon />
        <Row margin="0px 8px">{displayValue}</Row>
      </Row>
    </CopyHelper>
  )
}

export function SecondaryIdentifiers({
  account,
  uniswapUsername,
  ensUsername,
}: {
  account: string
  ensUsername: string | null
  uniswapUsername?: string
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setIsDropdownOpen(false))

  // Dropdown is present if more than one secondary identifier is available
  if (uniswapUsername && ensUsername) {
    return (
      <SecondaryIdentifiersContainer data-testid="secondary-identifiers" ref={ref}>
        <Row onClick={() => setIsDropdownOpen(!isDropdownOpen)} gap="8px">
          <ThemedText.BodySmall color="neutral2">{shortenAddress(account)}</ThemedText.BodySmall>
          <Popover
            show={isDropdownOpen}
            placement="bottom"
            content={
              <Dropdown data-testid="secondary-identifiers-dropdown">
                <SecondaryIdentifier Icon={EnsIcon} displayValue={ensUsername} copyValue={ensUsername} />
                <SecondaryIdentifier Icon={EthMini} displayValue={shortenAddress(account)} copyValue={account} />
              </Dropdown>
            }
          >
            <MoreIcon id="more-identifiers-icon" />
          </Popover>
        </Row>
      </SecondaryIdentifiersContainer>
    )
  }

  // Dropdown is not present if only one secondary identifier is available
  return (
    <ThemedText.BodySmall color="neutral2">
      <CopyHelper iconSize={14} iconPosition="right" toCopy={account}>
        {shortenAddress(account)}
      </CopyHelper>
    </ThemedText.BodySmall>
  )
}

export function Status({
  account,
  ensUsername,
  uniswapUsername,
  showAddressCopy = true,
}: {
  account: string
  ensUsername: string | null
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
          <SecondaryIdentifiers account={account} ensUsername={ensUsername} uniswapUsername={uniswapUsername} />
        )}
      </Identifiers>
    </Container>
  )
}
