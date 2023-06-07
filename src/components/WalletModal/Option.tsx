import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Loader from 'components/Icons/LoadingSpinner'
import { walletConnectV2Connection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { Connection, ConnectionType } from 'connection/types'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { MouseEvent, useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'

import NewBadge from './NewBadge'

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  flex-direction: row;
  align-items: center;
`

const OptionCardClickable = styled.button<{ selected: boolean }>`
  align-items: center;
  background-color: unset;
  border: none;
  cursor: pointer;
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  justify-content: space-between;
  opacity: ${({ disabled, selected }) => (disabled && !selected ? '0.5' : '1')};
  padding: 18px;
  transition: ${({ theme }) => theme.transition.duration.fast};
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
const WCv2PopoverContent = styled(ThemeButton)`
  background: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  max-width: 240px;
  padding: 16px;
  position: absolute;
  z-index: ${Z_INDEX.popover};
`
const TOGGLE_SIZE = 24
const WCv2PopoverToggle = styled.button`
  align-items: center;
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.textTertiary};
  cursor: pointer;
  display: flex;
  height: ${TOGGLE_SIZE}px;
  justify-content: center;
  margin: 0;
  max-width: 48px;
  padding: 0;
  position: absolute;
  right: 16px;
  top: calc(50% - ${TOGGLE_SIZE / 2}px);
  width: ${TOGGLE_SIZE}px;

  &:hover {
    opacity: 0.6;
  }
`
const Wrapper = styled.div<{ disabled: boolean }>`
  align-items: stretch;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
  width: 100%;

  background-color: ${({ theme }) => theme.backgroundModule};

  &:hover {
    cursor: ${({ disabled }) => !disabled && 'pointer'};
    background-color: ${({ theme, disabled }) => !disabled && theme.hoverState};
  }
  &:focus {
    background-color: ${({ theme, disabled }) => !disabled && theme.hoverState};
  }
`

interface PopupButtonContentProps {
  children: JSX.Element
  connection: Connection
  isDarkMode: boolean
  show: boolean
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  onClose: () => void
}
function PopupButtonContent({ connection, isDarkMode, show, children, onClick, onClose }: PopupButtonContentProps) {
  const popoverElement = useRef<HTMLButtonElement>(null)
  useOnClickOutside(popoverElement, onClose)
  return (
    <>
      {children}
      {show && (
        <WCv2PopoverContent
          onClick={onClick}
          style={{ top: 52, right: 10 }}
          ref={popoverElement}
          size={ButtonSize.small}
          emphasis={ButtonEmphasis.medium}
        >
          <IconWrapper>
            <img src={connection.getIcon?.(isDarkMode)} alt="Icon" style={{ height: '20px', width: '20px' }} />
          </IconWrapper>
          <div>
            <ThemedText.BodyPrimary style={{ marginBottom: '4px', textAlign: 'left' }}>
              Connect with v2
            </ThemedText.BodyPrimary>
            <ThemedText.Caption color="textSecondary" style={{ textAlign: 'left' }}>
              Under development and unsupported by most wallets
            </ThemedText.Caption>
          </div>
        </WCv2PopoverContent>
      )}
    </>
  )
}

interface OptionProps {
  connection: Connection
}
export default function Option({ connection }: OptionProps) {
  const { activationState, tryActivation } = useActivationState()
  const [WC2PromptOpen, setWC2PromptOpen] = useState(false)
  const [accountDrawerOpen, toggleAccountDrawerOpen] = useAccountDrawer()
  const activate = () => tryActivation(connection, toggleAccountDrawerOpen)

  useEffect(() => {
    if (!accountDrawerOpen) setWC2PromptOpen(false)
  }, [accountDrawerOpen])

  const isSomeOptionPending = activationState.status === ActivationStatus.PENDING
  const isCurrentOptionPending = isSomeOptionPending && activationState.connection.type === connection.type
  const isDarkMode = useIsDarkMode()

  const handleClickConnectViaWCv2 = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    tryActivation(walletConnectV2Connection, () => {
      setWC2PromptOpen(false)
      toggleAccountDrawerOpen()
    })
  }
  const handleClickOpenWCv2Tooltip = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setWC2PromptOpen(true)
  }

  return (
    <Wrapper disabled={isSomeOptionPending}>
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.WALLET_SELECTED}
        properties={{ wallet_type: connection.getName() }}
        element={InterfaceElementName.WALLET_TYPE_OPTION}
      >
        <OptionCardClickable
          disabled={isSomeOptionPending}
          onClick={activate}
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

      {connection.type === ConnectionType.WALLET_CONNECT && (
        <PopupButtonContent
          connection={connection}
          isDarkMode={isDarkMode}
          show={WC2PromptOpen}
          onClick={handleClickConnectViaWCv2}
          onClose={() => setWC2PromptOpen(false)}
        >
          <WCv2PopoverToggle onClick={handleClickOpenWCv2Tooltip} onMouseDown={handleClickOpenWCv2Tooltip}>
            <MoreHorizontal />
          </WCv2PopoverToggle>
        </PopupButtonContent>
      )}
    </Wrapper>
  )
}
