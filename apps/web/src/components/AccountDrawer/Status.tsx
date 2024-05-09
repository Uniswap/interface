import Column from 'components/Column'
import { ENS } from 'components/Icons/ENS'
import { EthMini } from 'components/Icons/EthMini'
import StatusIcon from 'components/Identicon/StatusIcon'
import Popover from 'components/Popover'
import Row from 'components/Row'
import { Connection } from 'connection/types'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, CopyHelper, EllipsisStyle, ThemedText } from 'theme/components'
import { Unitag } from 'ui/src/components/icons'
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
const IdentifierText = styled.span`
  ${EllipsisStyle}
  max-width: 120px;
  @media screen and (min-width: 1440px) {
    max-width: 180px;
  }
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
              <IdentifierText>{uniswapUsername ?? ensUsername ?? shortenAddress(account)}</IdentifierText>
              {uniswapUsername && <Unitag size={18} />}
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
