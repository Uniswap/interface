import React, { useState } from 'react'
import { useWeb3Context } from 'web3-react'
import classnames from 'classnames'
import Jazzicon from 'jazzicon'
import { CSSTransitionGroup } from 'react-transition-group'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'

import Modal from '../Modal'
import { useAllTransactions } from '../../contexts/Transactions'

import './web3-status.scss'

function getEtherscanLink(tx) {
  return `https://etherscan.io/tx/${tx}`
}

function getPendingText(pendingTransactions, pendingLabel) {
  return (
    <div className="web3-status__pending-container">
      <div className="loader" />
      <span key="text">
        {pendingTransactions.length} {pendingLabel}
      </span>
    </div>
  )
}

function getText(text, disconnectedText) {
  if (!text || text.length < 42 || !ethers.utils.isHexString(text)) {
    return disconnectedText
  }

  const address = ethers.utils.getAddress(text)
  return `${address.substring(0, 6)}...${address.substring(38)}`
}

export default function Web3Status() {
  const { t } = useTranslation()
  const { active, account } = useWeb3Context()

  const allTransactions = useAllTransactions()
  const pending = Object.keys(allTransactions).filter(hash => !allTransactions[hash].receipt)
  const confirmed = Object.keys(allTransactions).filter(hash => allTransactions[hash].receipt)

  const hasPendingTransactions = !!pending.length
  const hasConfirmedTransactions = !!confirmed.length

  const [isShowingModal, setIsShowingModal] = useState(false)

  function handleClick() {
    if (pending.length && !isShowingModal) {
      setIsShowingModal(true)
    }
  }

  function renderPendingTransactions() {
    return pending.map(transaction => {
      return (
        <div
          key={transaction}
          className={classnames('pending-modal__transaction-row')}
          onClick={() => window.open(getEtherscanLink(transaction), '_blank')}
        >
          <div className="pending-modal__transaction-label">{transaction}</div>
          <div className="pending-modal__pending-indicator">
            <div className="loader" /> {t('pending')}
          </div>
        </div>
      )
    })
  }

  function renderModal() {
    if (!isShowingModal) {
      return null
    }

    return (
      <Modal onClose={() => setIsShowingModal(false)}>
        <CSSTransitionGroup
          transitionName="token-modal"
          transitionAppear={true}
          transitionLeave={true}
          transitionAppearTimeout={200}
          transitionLeaveTimeout={200}
          transitionEnterTimeout={200}
        >
          <div className="pending-modal">
            <div className="pending-modal__transaction-list">
              <div className="pending-modal__header">Transactions</div>
              {renderPendingTransactions()}
            </div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    )
  }

  return (
    <div
      className={classnames('web3-status', {
        'web3-status__connected': active,
        'web3-status--pending': hasPendingTransactions,
        'web3-status--confirmed': hasConfirmedTransactions
      })}
      onClick={handleClick}
    >
      <div className="web3-status__text">
        {hasPendingTransactions ? getPendingText(pending, t('pending')) : getText(account, t('disconnected'))}
      </div>
      <div
        className="web3-status__identicon"
        ref={el => {
          if (!el || !account) {
            return
          } else {
            el.innerHTML = ''
            el.appendChild(Jazzicon(16, parseInt(account.slice(2, 10), 16)))
          }
        }}
      />
      {renderModal()}
    </div>
  )
}
