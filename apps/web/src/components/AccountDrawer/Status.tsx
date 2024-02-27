import Column from 'components/Column'
import { ENS } from 'components/Icons/ENS'
import { EthMini } from 'components/Icons/EthMini'
import StatusIcon from 'components/Identicon/StatusIcon'
import Row from 'components/Row'
import { Connection } from 'connection/types'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, CopyHelper, ThemedText } from 'theme/components'
import { Icons } from 'ui/src'
import { shortenAddress } from 'utilities/src/addresses'

const Container = styled.div`
  display: inline-block;
  width: 70%;
  max-width: 70%;
  padding-right: 8px;
  display: inline-flex;
`
const Identifiers = styled.div`
  white-space: nowrap;
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  margin-left: 8px;
  user-select: none;
`
const SecondaryIdentifiersContainer = styled(Row)`
  position: relative;
  user-select: none;
  :hover > div > #more-identifiers-icon {
    display: inline-block;
  }
`
const MoreIcon = styled(MoreHorizontal)<{ $isActive: boolean }>`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.neutral2};
  cursor: pointer;
  display: ${({ $isActive }) => !$isActive && 'none'};
  ${ClickableStyle}
`
const Dropdown = styled(Column)`
  width: 240px;
  position: absolute;
  top: 20px;
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

function SecondaryIdentifiers({
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
          <MoreIcon id="more-identifiers-icon" $isActive={isDropdownOpen} />
        </Row>
        {isDropdownOpen && (
          <Dropdown>
            <SecondaryIdentifier Icon={EnsIcon} displayValue={ensUsername} copyValue={ensUsername} />
            <SecondaryIdentifier Icon={EthMini} displayValue={shortenAddress(account)} copyValue={account} />
          </Dropdown>
        )}
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
  connection,
}: {
  account: string
  ensUsername: string | null
  uniswapUsername?: string
  connection: Connection
}) {
  return (
    <Container data-testid="account-drawer-status">
      <StatusIcon account={account} connection={connection} size={40} />
      <Identifiers>
        <ThemedText.SubHeader>
          <CopyHelper
            iconSize={14}
            iconPosition="right"
            toCopy={uniswapUsername ? uniswapUsername + '.uni.eth' : ensUsername ? ensUsername : account}
          >
            <Row gap="2px">
              {uniswapUsername ?? ensUsername ?? shortenAddress(account)}
              {uniswapUsername && <Icons.Unitag size={18} />}
            </Row>
          </CopyHelper>
        </ThemedText.SubHeader>
        {(uniswapUsername || ensUsername) && (
          <SecondaryIdentifiers account={account} ensUsername={ensUsername} uniswapUsername={uniswapUsername} />
        )}
      </Identifiers>
    </Container>
  )
}
