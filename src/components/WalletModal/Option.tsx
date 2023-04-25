import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useCloseAccountDrawer } from 'components/AccountDrawer'
import Loader from 'components/Icons/LoadingSpinner'
import { Connection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

import NewBadge from './NewBadge'

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  flex-direction: row;
  align-items: center;
`

const OptionCardClickable = styled.button<{ clickable: boolean; selected: boolean }>`
  background-color: ${({ theme }) => theme.backgroundModule};
  border: none;
  width: 100% !important;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 18px;

  transition: ${({ theme }) => theme.transition.duration.fast};
  opacity: ${({ clickable, selected }) => (!clickable && !selected ? '0.5' : '1')};

  ${({ clickable }) => !clickable && 'pointer-events: none'};

  &:hover {
    cursor: ${({ clickable }) => clickable && 'pointer'};
    background-color: ${({ theme, clickable }) => clickable && theme.hoverState};
  }
  &:focus {
    background-color: ${({ theme, clickable }) => clickable && theme.hoverState};
  }
`

const HeaderText = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.accentAction : ({ theme }) => theme.textPrimary)};
  font-size: 16px;
  font-weight: 600;
  padding: 0 8px;
`

const IconWrapper = styled.div`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: 40px;
    width: 40px;
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

export default function Option({ connection }: { connection: Connection }) {
  const { activationState, tryActivation } = useActivationState()
  const closeDrawer = useCloseAccountDrawer()
  const activate = () => tryActivation(connection, closeDrawer)

  const isSomeConnectorPending = activationState.status === ActivationStatus.PENDING
  const isCurrentOptionPending = isSomeConnectorPending && activationState.connection.type === connection.type
  const isDarkMode = useIsDarkMode()

  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={InterfaceEventName.WALLET_SELECTED}
      properties={{ wallet_type: connection.getName() }}
      element={InterfaceElementName.WALLET_TYPE_OPTION}
    >
      <OptionCardClickable
        onClick={activate}
        clickable={!isSomeConnectorPending}
        selected={isCurrentOptionPending}
        data-testid="wallet-modal-option"
      >
        <OptionCardLeft>
          <IconWrapper>
            <img src={connection.getIcon?.(isDarkMode)} alt="Icon" />
          </IconWrapper>
          <HeaderText>{connection.getName()}</HeaderText>
          {connection.isNew && <NewBadge />}
        </OptionCardLeft>
        {isCurrentOptionPending && <Loader />}
      </OptionCardClickable>
    </TraceEvent>
  )
}
