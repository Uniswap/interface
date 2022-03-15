import React, { ReactNode, useRef } from 'react'
import styled from 'styled-components'
import { useWeb3React } from '@web3-react/core'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { isMobile } from 'react-device-detect'
import { SUPPORTED_WALLETS } from '../../constants'
import { injected } from '../../connectors'
import MetamaskIcon from '../../assets/images/metamask.png'
import { ModalView } from '.'
import Popover from '../Popover'
import { useCloseModals, useModalOpen } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/actions'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { StyledConnectedIcon } from '../../utils'

const Wrapper = styled.div`
  width: 100%;
`

const List = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
  margin-top: 12px;
`

const ListItem = styled.li`
  & + & {
    margin-top: 20px;
    margin-bottom: 20px;
  }
`

export const DisconnectButton = styled.button`
  width: 100%;
  padding: 20px 18px;
  font-weight: bold;
  font-size: 11px;
  line-height: 13px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.text1};
  background: ${({ theme }) => theme.dark2};;
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 0px 0px 8px 8px;
`

const ListButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0;
  font-weight: 700;
  font-size: 12px;
  line-height: 15px;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: ${({ theme }) => theme.text2};
  background: none;
  border: 0;
  outline: none;
  cursor: pointer;
  padding: 0 22px;

  &:disabled {
    cursor: not-allowed;
    filter: grayscale(90%);
    opacity: 0.6;
  }
`

const ListIconWrapper = styled.div<{ isActive?: boolean }>`
  display: inline-flex;
  justify-content: space-evenly;
  align-items: center;
  width: 20px;
  height: 20px;
  margin-right: ${ props => (props.isActive ? "34px" : "8px")};

  img {
    max-width: 100%;
  }
`

const StyledPopover = styled(Popover)<{ isActive?: boolean }>`
  max-width: 290px;
  background-color: ${({ theme }) => theme.bg1};
  border-color: ${({ theme }) => theme.dark2};
  border-style: solid;
  border-width: 1.2px;
  border-radius: 12px;
  border-image: none;
  padding: ${ props => (props.isActive ? "8px 0 0 0" : "8px")};
`

interface ConnectWalletProps {
  setModal: (modal: ModalView | null) => void
  tryActivation: (connector: AbstractConnector | undefined) => void
  children: ReactNode
}

export const ConnectWalletPopover = ({ setModal, tryActivation, children }: ConnectWalletProps) => {
  const { connector, active, deactivate } = useWeb3React()
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const walletSwitcherPopoverOpen = useModalOpen(ApplicationModal.WALLET_SWITCHER)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (walletSwitcherPopoverOpen) closeModals()
  })

  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        if (option.mobile) {
          return (
            <Item
              key={key}
              id={`connect-${key}`}
              name={option.name}
              onClick={() => {
                closeModals()
                option.connector !== connector && !option.href && tryActivation(option.connector)
              }}
              icon={require('../../assets/images/' + option.iconName)}
              isActive={option.connector && option.connector === connector}
            />
          )
        }
        return null
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Item
                key={key}
                id={`connect-${key}`}
                name="Install Metamask"
                icon={MetamaskIcon}
                link={'https://metamask.io/'}
                onClick={closeModals}
              />
            )
          } else {
            return null //dont want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly && (
          <Item
            key={key}
            id={`connect-${key}`}
            onClick={() => {
              closeModals()
              option.connector === connector
                ? setModal(ModalView.Account)
                : !option.href && tryActivation(option.connector)
            }}
            name={option.name}
            icon={require('../../assets/images/' + option.iconName)}
            isActive={option.connector && option.connector === connector}
          />
        )
      )
    })
  }

  return (
    <Wrapper>
      <StyledPopover
        innerRef={popoverRef}
        content={
          <List>
            {getOptions()}
            { active && <DisconnectButton onClick={deactivate}>Disconnect Wallet</DisconnectButton> }
          </List>
        }
        show={walletSwitcherPopoverOpen}
        isActive={active}
        placement="bottom-end"
      >
        {children}
      </StyledPopover>
    </Wrapper>
  )
}

interface ItemProps {
  id: string
  icon: string
  name: string
  link?: string
  onClick?: () => void
  isActive?: boolean
}

export const Item = ({ id, onClick, name, icon, link, isActive }: ItemProps) => {
  const getContent = () => (
    <>
      <ListIconWrapper isActive={isActive}>
        { isActive && <StyledConnectedIcon width="50px" padding="0 0 0 12px" /> }
        <img src={icon} alt={name + ' logo'} />
      </ListIconWrapper>
      {name}
    </>
  )

  return (
    <ListItem id={id}>
      {!!link ? (
        <ListButton as="a" href={link} target="_blank" rel="noopener noreferrer">
          {getContent()}
        </ListButton>
      ) : (
        <ListButton onClick={onClick}>
          {getContent()}
        </ListButton>
      )}
    </ListItem>
  )
}
