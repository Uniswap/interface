import React, { useState, useRef, useEffect, useMemo } from 'react'
import { CSSTransitionGroup } from 'react-transition-group'
import classnames from 'classnames'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import escapeStringRegex from 'escape-string-regexp'

import { useTokenContract } from '../../hooks'
import { isAddress, calculateGasMargin } from '../../utils'
import Modal from '../Modal'
import TokenLogo from '../TokenLogo'
import SearchIcon from '../../assets/images/magnifying-glass.svg'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'
import { useTokenDetails, useAllTokenDetails } from '../../contexts/Tokens'

import './currency-panel.scss'

const GAS_MARGIN = ethers.utils.bigNumberify(1000)

export default function CurrencyInputPanel({
  filteredTokens = [],
  onValueChange = () => {},
  renderInput,
  onCurrencySelected = () => {},
  title,
  description,
  extraText,
  extraTextClickHander = () => {},
  errorMessage,
  disableUnlock,
  disableTokenSelect,
  selectedTokenAddress = '',
  showUnlock,
  value
}) {
  const { t } = useTranslation()

  const [isShowingModal, setIsShowingModal] = useState(false)

  const tokenContract = useTokenContract(selectedTokenAddress)
  const { exchangeAddress: selectedTokenExchangeAddress } = useTokenDetails(selectedTokenAddress)

  const pendingApproval = usePendingApproval(selectedTokenAddress)

  const addTransaction = useTransactionAdder()
  const inputRef = useRef()

  const allTokens = useAllTokenDetails()

  // manage focus on modal show
  useEffect(() => {
    if (inputRef.current && isShowingModal) {
      inputRef.current.focus()
    }
  }, [isShowingModal])

  function renderUnlockButton() {
    if (disableUnlock || !showUnlock || selectedTokenAddress === 'ETH' || !selectedTokenAddress) {
      return null
    } else {
      if (!pendingApproval) {
        return (
          <button
            className="currency-input-panel__sub-currency-select"
            onClick={async () => {
              const estimatedGas = await tokenContract.estimate.approve(
                selectedTokenExchangeAddress,
                ethers.constants.MaxUint256
              )

              tokenContract
                .approve(selectedTokenExchangeAddress, ethers.constants.MaxUint256, {
                  gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                })
                .then(response => {
                  addTransaction(response)
                })
            }}
          >
            {t('unlock')}
          </button>
        )
      } else {
        return (
          <button className="currency-input-panel__sub-currency-select currency-input-panel__sub-currency-select--pending">
            <div className="loader" />
            {t('pending')}
          </button>
        )
      }
    }
  }

  function _renderInput() {
    if (typeof renderInput === 'function') {
      return renderInput()
    }

    return (
      <div className="currency-input-panel__input-row">
        <input
          type="number"
          min="0"
          className={classnames('currency-input-panel__input', {
            'currency-input-panel__input--error': errorMessage
          })}
          placeholder="0.0"
          onChange={e => onValueChange(e.target.value)}
          onKeyPress={e => {
            const charCode = e.which ? e.which : e.keyCode

            // Prevent 'minus' character
            if (charCode === 45) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          value={value}
        />
        {renderUnlockButton()}
        <button
          className={classnames('currency-input-panel__currency-select', {
            'currency-input-panel__currency-select--selected': selectedTokenAddress,
            'currency-input-panel__currency-select--disabled': disableTokenSelect
          })}
          onClick={() => {
            if (!disableTokenSelect) {
              setIsShowingModal(true)
            }
          }}
        >
          {selectedTokenAddress ? (
            <TokenLogo className="currency-input-panel__selected-token-logo" address={selectedTokenAddress} />
          ) : null}
          {(allTokens[selectedTokenAddress] && allTokens[selectedTokenAddress].symbol) || t('selectToken')}
          <span className="currency-input-panel__dropdown-icon" />
        </button>
      </div>
    )
  }

  return (
    <div className="currency-input-panel">
      <div
        className={classnames('currency-input-panel__container', {
          'currency-input-panel__container--error': errorMessage
        })}
      >
        <div className="currency-input-panel__label-row">
          <div className="currency-input-panel__label-container">
            <span className="currency-input-panel__label">{title}</span>
            <span className="currency-input-panel__label-description">{description}</span>
          </div>
          <span
            className={classnames('currency-input-panel__extra-text', {
              'currency-input-panel__extra-text--error': errorMessage
            })}
            onClick={() => {
              extraTextClickHander()
            }}
          >
            {extraText}
          </span>
        </div>
        {_renderInput()}
      </div>
      {!disableTokenSelect && isShowingModal && (
        <CurrencySelectModal
          onTokenSelect={onCurrencySelected}
          onClose={() => {
            setIsShowingModal(false)
          }}
        />
      )}
    </div>
  )
}

function CurrencySelectModal({ onClose, onTokenSelect }) {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const { exchangeAddress } = useTokenDetails(searchQuery)

  const allTokens = useAllTokenDetails()
  const tokenList = useMemo(() => {
    return Object.keys(allTokens)
      .sort((a, b) => {
        const aSymbol = allTokens[a].symbol
        const bSymbol = allTokens[b].symbol
        if (aSymbol === 'ETH' || bSymbol === 'ETH') {
          return aSymbol === bSymbol ? 0 : aSymbol === 'ETH' ? -1 : 1
        } else {
          return aSymbol < bSymbol ? -1 : aSymbol > bSymbol ? 1 : 0
        }
      })
      .map(k => {
        return {
          name: allTokens[k].name,
          symbol: allTokens[k].symbol,
          address: k
        }
      })
  }, [allTokens])
  const filteredTokenList = useMemo(() => {
    return tokenList.filter(tokenEntry => {
      // check the regex for each field
      const regexMatches = Object.keys(tokenEntry).map(tokenEntryKey => {
        return (
          tokenEntry[tokenEntryKey] &&
          !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
        )
      })

      return regexMatches.some(m => m)
    })
  }, [tokenList, searchQuery])

  function _onTokenSelect(address) {
    setSearchQuery('')
    onTokenSelect(address)
    onClose()
  }

  function _onClose(address) {
    setSearchQuery('')
    onClose()
  }

  function renderTokenList() {
    if (isAddress(searchQuery) && exchangeAddress === undefined) {
      return (
        <div className="token-modal__token-row token-modal__token-row--searching">
          <div className="loader" />
          <div>Searching for Exchange...</div>
        </div>
      )
    }

    if (isAddress(searchQuery) && exchangeAddress === ethers.constants.AddressZero) {
      return (
        <>
          <div className="token-modal__token-row token-modal__token-row--no-exchange">
            <div>{t('noExchange')}</div>
          </div>
          <Link
            to={`/create-exchange/${searchQuery}`}
            className="token-modal__token-row token-modal__token-row--create-exchange"
            onClick={onClose}
          >
            <div>{t('createExchange')}</div>
          </Link>
        </>
      )
    }

    if (!filteredTokenList.length) {
      return (
        <div className="token-modal__token-row token-modal__token-row--no-exchange">
          <div>{t('noExchange')}</div>
        </div>
      )
    }

    return filteredTokenList.map(({ address, symbol }) => {
      return (
        <div key={address} className="token-modal__token-row" onClick={() => _onTokenSelect(address)}>
          <TokenLogo className="token-modal__token-logo" address={address} />
          <div className="token-modal__token-label">{symbol}</div>
        </div>
      )
    })
  }

  // manage focus on modal show
  const inputRef = useRef()
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  function onInput(event) {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }

  return (
    <Modal onClose={_onClose}>
      <CSSTransitionGroup
        transitionName="token-modal"
        transitionAppear={true}
        transitionLeave={true}
        transitionAppearTimeout={200}
        transitionLeaveTimeout={200}
        transitionEnterTimeout={200}
      >
        <div className="token-modal">
          <div className="token-modal__search-container">
            <input
              ref={inputRef}
              type="text"
              placeholder={t('searchOrPaste')}
              className="token-modal__search-input"
              onChange={onInput}
            />
            <img src={SearchIcon} className="token-modal__search-icon" alt="search" />
          </div>
          <div className="token-modal__token-list">{renderTokenList()}</div>
        </div>
      </CSSTransitionGroup>
    </Modal>
  )
}
