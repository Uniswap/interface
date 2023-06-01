import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useCloseAccountDrawer } from 'components/AccountDrawer'
import Loader from 'components/Icons/LoadingSpinner'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { Connection } from 'connection/types'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

import NewBadge from './NewBadge'

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  flex-direction: row;
  align-items: center;
`

const OptionCardClickable = styled.button<{ selected: boolean }>`
  background-color: ${({ theme }) => theme.backgroundModule};
  border: none;
  width: 100% !important;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 18px;

  transition: ${({ theme }) => theme.transition.duration.fast};
  opacity: ${({ disabled, selected }) => (disabled && !selected ? '0.5' : '1')};

  &:hover {
    cursor: ${({ disabled }) => !disabled && 'pointer'};
    background-color: ${({ theme, disabled }) => !disabled && theme.hoverState};
  }
  &:focus {
    background-color: ${({ theme, disabled }) => !disabled && theme.hoverState};
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

  const isSomeOptionPending = activationState.status === ActivationStatus.PENDING
  const isCurrentOptionPending = isSomeOptionPending && activationState.connection.type === connection.type
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
        disabled={isSomeOptionPending}
        selected={isCurrentOptionPending}
        data-testid={`wallet-option-${connection.type}`}
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
