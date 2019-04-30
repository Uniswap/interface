import React, { useState, useRef, useEffect } from 'react'
import { CSSTransitionGroup } from 'react-transition-group'
import classnames from 'classnames'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'

import { useTokenContract } from '../../hooks'
import { isAddress, calculateGasMargin } from '../../utils'
import Fuse from '../../helpers/fuse'
import Modal from '../Modal'
import TokenLogo from '../TokenLogo'
import SearchIcon from '../../assets/images/magnifying-glass.svg'
import { useTokenDetails, useAllTokenDetails, useTokenDetailsContext } from '../../contexts/Static'
import { useTransactionContext, getPendingApproval } from '../../contexts/Transaction'

import './currency-panel.scss'
import { useWeb3Context } from 'web3-react'

const GAS_MARGIN = ethers.utils.bigNumberify(1000)

const FUSE_OPTIONS = {
  includeMatches: false,
  threshold: 0.0,
  tokenize: true,
  location: 0,
  distance: 100,
  maxPatternLength: 45,
  minMatchCharLength: 1,
  keys: [{ name: 'address', weight: 0.8 }, { name: 'label', weight: 0.5 }]
}

export default function CurrencyInputPanel({
  filteredTokens = [],
  onValueChange = () => {},
  renderInput,
  onCurrencySelected = () => {},
  title,
  description,
  extraText,
  extraTextClickHander,
  errorMessage,
  selectedTokens = [],
  disableUnlock,
  disableTokenSelect,
  selectedTokenAddress = '',
  showUnlock,
  value
}) {
  const { t } = useTranslation()
  const { networkId, library } = useWeb3Context()

  const tokenContract = useTokenContract(selectedTokenAddress)
  const { exchangeAddress: selectedTokenExchangeAddress } = useTokenDetails(selectedTokenAddress)

  const { forceUpdateValue } = useTokenDetailsContext()

  const pendingApproval = getPendingApproval(selectedTokenAddress)

  const { addTransaction } = useTransactionContext()
  const inputRef = useRef()

  const [isShowingModal, setIsShowingModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { exchangeAddress: searchQueryExchangeAddress } = useTokenDetails(searchQuery)

  const allTokens = useAllTokenDetails()

  // manage focus on modal show
  useEffect(() => {
    if (inputRef.current && isShowingModal) {
      inputRef.current.focus()
    }
  }, [inputRef.current, isShowingModal])

  function createTokenList() {
    return Object.keys(allTokens)
      .slice()
      .sort((a, b) => {
        const aSymbol = allTokens[a].symbol
        const bSymbol = allTokens[b].symbol
        if (aSymbol === 'ETH' || bSymbol === 'ETH') {
          return aSymbol === 'ETH' ? -1 : 1
        } else {
          return aSymbol < bSymbol ? -1 : aSymbol > bSymbol ? 1 : 0
        }
      })
      .map(k => {
        return {
          value: allTokens[k].symbol,
          label: allTokens[k].symbol,
          address: k
        }
      })
      .filter(({ address }) => !filteredTokens.includes(address))
  }

  function onTokenSelect(address) {
    setSearchQuery('')
    setIsShowingModal(false)

    onCurrencySelected(address)
  }

  function renderTokenList() {
    const tokens = createTokenList()

    if (disableTokenSelect) {
      return
    }

    if (isAddress(searchQuery) && searchQueryExchangeAddress === undefined) {
      return (
        <div className="token-modal__token-row token-modal__token-row--searching">
          <div className="loader" />
          <div>Searching for Exchange...</div>
        </div>
      )
    }

    let results
    if (!searchQuery) {
      results = tokens
    } else {
      const fuse = new Fuse(tokens, FUSE_OPTIONS)
      results = fuse.search(searchQuery)
    }

    if (!results.length) {
      if (isAddress(searchQuery) && searchQueryExchangeAddress === ethers.constants.AddressZero) {
        forceUpdateValue(searchQuery, networkId, library)

        return (
          <>
            <div className="token-modal__token-row token-modal__token-row--no-exchange">
              <div>{t('noExchange')}</div>
            </div>
            <Link
              to={`/create-exchange/${searchQuery}`}
              className="token-modal__token-row token-modal__token-row--create-exchange"
              onClick={() => {
                setIsShowingModal(false)
              }}
            >
              <div>{t('createExchange')}</div>
            </Link>
          </>
        )
      } else {
        return (
          <div className="token-modal__token-row token-modal__token-row--no-exchange">
            <div>{t('noExchange')}</div>
          </div>
        )
      }
    }

    return results.map(({ label, address }) => {
      const isSelected = selectedTokens.indexOf(address) > -1

      return (
        <div
          key={label}
          className={classnames('token-modal__token-row', {
            'token-modal__token-row--selected': isSelected
          })}
          onClick={() => onTokenSelect(address)}
        >
          <TokenLogo className="token-modal__token-logo" address={address} />
          <div className="token-modal__token-label">{label}</div>
        </div>
      )
    })
  }

  function renderModal() {
    if (!isShowingModal) {
      return null
    }

    return (
      <Modal
        onClose={() => {
          setIsShowingModal(false)
          setSearchQuery('')
        }}
      >
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
                onChange={e => {
                  setSearchQuery(e.target.value)
                }}
              />
              <img src={SearchIcon} className="token-modal__search-icon" alt="search" />
            </div>
            <div className="token-modal__token-list">{renderTokenList()}</div>
          </div>
        </CSSTransitionGroup>
      </Modal>
    )
  }

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
                  addTransaction(response.hash, response)
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
      {renderModal()}
    </div>
  )
}
