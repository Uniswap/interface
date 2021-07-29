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

const Wrapper = styled.div`
  width: 100%;
`

const List = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
`

const ListItem = styled.li`
  & + & {
    margin-top: 24px;
  }
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
  border: 0;
  background: none;
  outline: none;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    filter: grayscale(90%);
    opacity: 0.6;
  }
`

const ListIconWrapper = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin-right: 8px;

  img {
    max-width: 100%;
  }
`

const StyledPopover = styled(Popover)`
  max-width: 290px;
  padding: 22px;
  background-color: ${({ theme }) => theme.bg1};
  border-color: ${({ theme }) => theme.dark2};
  border-style: solid;
  border-width: 1.2px;
  border-radius: 12px;
  border-image: none;
`

interface ConnectWalletProps {
  setModal: (modal: ModalView | null) => void
  tryActivation: (connector: AbstractConnector | undefined) => void
  children: ReactNode
}

export const ConnectWalletPopover = ({ setModal, tryActivation, children }: ConnectWalletProps) => {
  const { connector } = useWeb3React()

  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        if (option.mobile) {
          return (
            <>
              <Item
                key={key}
                id={`connect-${key}`}
                name={option.name}
                onClick={() => {
                  option.connector !== connector && !option.href && tryActivation(option.connector)
                }}
                icon={require('../../assets/images/' + option.iconName)}
                active={option.connector && option.connector === connector}
              />
            </>
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
              <>
                <Item
                  key={key}
                  id={`connect-${key}`}
                  name="Install Metamask"
                  icon={MetamaskIcon}
                  link={'https://metamask.io/'}
                />
              </>
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
              option.connector === connector
                ? setModal(ModalView.Account)
                : !option.href && tryActivation(option.connector)
            }}
            name={option.name}
            icon={require('../../assets/images/' + option.iconName)}
            active={option.connector && option.connector === connector}
          />
        )
      )
    })
  }

  const popoverRef = useRef(null)
  const walletSwitcherPopoverOpen = useModalOpen(ApplicationModal.WALLET_SWITCHER)
  const closeModals = useCloseModals()
  useOnClickOutside(popoverRef, () => {
    if (walletSwitcherPopoverOpen) closeModals()
  })

  return (
    <Wrapper ref={popoverRef}>
      <StyledPopover content={<List>{getOptions()}</List>} show={walletSwitcherPopoverOpen} placement="bottom-end">
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
  active?: boolean
}

export const Item = ({ id, onClick, name, icon, link, active }: ItemProps) => {
  const getContent = () => (
    <>
      <ListIconWrapper>
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
        <ListButton disabled={active} onClick={onClick}>
          {getContent()}
        </ListButton>
      )}
    </ListItem>
  )
}
