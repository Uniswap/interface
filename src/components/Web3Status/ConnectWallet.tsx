import React from 'react'
import styled from 'styled-components'
import { useWeb3React } from '@web3-react/core';
import { AbstractConnector } from '@web3-react/abstract-connector'
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next'
import { SUPPORTED_WALLETS } from '../../constants';
import { Dropdown } from '../Dropdown';
import { injected } from '../../connectors'
import MetamaskIcon from '../../assets/images/metamask.png';
import { DropdownView, ModalView } from '.';

const Button = styled.button`
  padding: 10.5px 14px;
  background-color: ${({ theme }) => theme.primary1};
  color: ${({ theme }) => theme.text1};
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 12px;
  line-height: 12px;
  letter-spacing: 0.08em;
  border: none;
  cursor: pointer;
`

const List = styled.ul`
  padding: 22px;
  margin: 0;
  list-style: none;
`;

const ListItem = styled.li`
  & + & {
    margin-top: 24px;
  }
`;

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
  cursor: pointer;
`;

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
`;

interface ConnectWalletProps {
  setModal: (modal: ModalView | null) => void;
  dropdown: DropdownView | null
  setDropdown: (dropdown: DropdownView | null) => void;
  tryActivation: (connector: AbstractConnector | undefined) => void
}

export const ConnectWallet = ({setModal, tryActivation, dropdown, setDropdown}: ConnectWalletProps) => {
  const { connector } = useWeb3React()
  const { t } = useTranslation();
  
  const toggleDropdown = () => dropdown !== null ? setDropdown(null) : setDropdown(DropdownView.NetworkOptions);
  
  function getOptions() {
    const isMetamask = window.ethereum && window.ethereum.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map(key => {
      const option = SUPPORTED_WALLETS[key]
      // check for mobile options
      if (isMobile) {
        if (!window.web3 && !window.ethereum && option.mobile) {
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
            onClick={() => {option.connector === connector
              ? setModal(ModalView.Account)
              : !option.href && tryActivation(option.connector)
            }}
            name={option.name}
            icon={require('../../assets/images/' + option.iconName)}
          />
        )
      )
    })
  }
    
  return (
    <Dropdown
      isVisible={dropdown === DropdownView.NetworkOptions}
      dropdownButton={
        <Button id="connect-wallet" onClick={toggleDropdown}>
          {t('Connect wallet')}
        </Button>
      }
    >
      <List>{getOptions()}</List>
    </Dropdown>
  )
}

interface ItemProps {
  id: string;
  icon: string;
  name: string;
  link?: string;
  onClick?: () => void;
}

export const Item = ({id, onClick, name, icon, link}: ItemProps) => {

  const getContent = () => (
    <>
      <ListIconWrapper>
        <img src={icon} alt={name + ' logo'}/>
      </ListIconWrapper>
      {name}
    </>
  )
  
  return (
    <ListItem id={id}>
      {!!link 
        ? <ListButton as="a" href={link} target="_blank" rel="noopener noreferrer">{getContent()}</ListButton>
        : <ListButton onClick={onClick}>{getContent()}</ListButton>
      }
    </ListItem>
  )
}
