import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { Activity } from 'react-feather'

import { shortenAddress } from '../../utils'
import { useENSName } from '../../hooks'
import WalletModal from '../WalletModal'
import { useAllTransactions } from '../../contexts/Transactions'
import { useWalletModalToggle } from '../../contexts/Application'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle-white.svg'
import { fortmatic, injected, portis, torus, walletconnect, walletlink } from '../../connectors'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import PortisIcon from '../../assets/images/portisIcon.png'
import TorusIcon from '../../assets/images/torus.png'
import { NetworkContextName } from '../../constants'
import Identicon from '../Identicon'
import Button from '@material-ui/core/Button'

const Web3StatusGeneric = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  font-size: 0.9rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 5px;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  box-shadow: 1px 1px 8px -4px rgba(0, 0, 0, 0.5), 1px 1px 4px -4px rgba(0, 0, 0, 0.5);
  margin-top: 10px;
  height: 40px;
  border: none !important;
  :focus {
    outline: none;
  }
`
// const Web3StatusError = styled(Web3StatusGeneric)`
//   background-color: ${({ theme }) => theme.salmonRed};
//   color: #ffffff;
//   font-weight: 500;
//   :hover,
//   :focus {
//     background-color: ${({ theme }) => darken(0.1, theme.salmonRed)};
//   }
// `

// const Web3StatusConnect = styled(Web3StatusGeneric)`
//   background-color: transparent;
//   color: #000000;
//   font-weight: 500;
//
//   :hover,
//   :focus {
//     color: ${({ theme }) => darken(0.1, theme.royalBlue)};
//   }
//
//   ${({ faded }) =>
//   faded &&
//   css`
//       background-color: transparent;
//       color: ${({ theme }) => theme.royalBlue};
//
//       :hover,
//       :focus {
//         color: #f0f0f0;
//       }
//     `}
// `

// const Web3StatusConnected = styled(Web3StatusGeneric)`
//   background-color: #327ccb;
//   color: #ffffff;
//   font-weight: 400;
//   :hover {
//     background-color: #5490d0;
//
//     :focus {
//     }
//   }
// `

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 0.83rem;
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
`

const IconWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
`

export default function Web3Status() {
  const { t } = useTranslation()
  const { active, account, connector, error } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  const ENSName = useENSName(account)

  const allTransactions = useAllTransactions()
  const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)
  const confirmed = Object.keys(allTransactions).filter(hash => allTransactions[hash].receipt)

  const hasPendingTransactions = !!pending.length

  const toggleWalletModal = useWalletModalToggle()

  // handle the logo we want to show with the account
  function getStatusIcon() {
    if (connector === injected) {
      return <Identicon />
    } else if (connector === walletconnect) {
      return (
        <IconWrapper size={16}>
          <img src={WalletConnectIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={16}>
          <img src={CoinbaseWalletIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === fortmatic) {
      return (
        <IconWrapper size={16}>
          <img src={FortmaticIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === portis) {
      return (
        <IconWrapper size={16}>
          <img src={PortisIcon} alt={''} />
        </IconWrapper>
      )
    } else if (connector === torus) {
      return (
        <IconWrapper size={16}>
          <img src={TorusIcon} alt={''} />
        </IconWrapper>
      )
    }
  }

  function getWeb3Status() {
    if (account) {
      return (
        <Button onClick={toggleWalletModal}>
          {hasPendingTransactions && <SpinnerWrapper src={Circle} alt="loader" />}
          <Text>{ENSName || shortenAddress(account)}</Text>
          {getStatusIcon()}
        </Button>
      )
    } else if (error) {
      return (
        <Button onClick={toggleWalletModal}>
          <NetworkIcon />
          <Text>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}</Text>
        </Button>
      )
    } else {
      return (
        <Button onClick={toggleWalletModal} faded={(!account).toString()}>
          <Text>{t('connectToWallet')}</Text>
        </Button>
      )
    }
  }

  if (!contextNetwork.active && !active) {
    return null
  }

  return (
    <>
      {getWeb3Status()}
      <WalletModal ENSName={ENSName} pendingTransactions={pending} confirmedTransactions={confirmed} />
    </>
  )
}
