import React, { useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import { CSSTransitionGroup } from 'react-transition-group'
import classnames from 'classnames'
import { withRouter } from 'react-router-dom'
import { withTranslation, useTranslation } from 'react-i18next'
import { BigNumber as BN } from 'bignumber.js'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'

import { useSignerOrProvider } from '../../hooks'
import { getExchangeDetails, getTokenDetails, isAddress } from '../../utils'
import Fuse from '../../helpers/fuse'
import Modal from '../Modal'
import TokenLogo from '../TokenLogo'
import SearchIcon from '../../assets/images/magnifying-glass.svg'
import { selectors, addPendingTx } from '../../ducks/web3connect'
import { addApprovalTx } from '../../ducks/pending'
import { addExchange } from '../../ducks/addresses'
import ERC20_ABI from '../../abi/erc20'

import './currency-panel.scss'

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

const TOKEN_ADDRESS_TO_LABEL = { ETH: 'ETH' }

function CurrencyInputPanel({
  tokenAddresses,
  filteredTokens = [],
  onValueChange = () => {},
  renderInput,
  onCurrencySelected = () => {},
  title,
  description,
  extraText,
  errorMessage,
  selectedTokens = [],
  disableUnlock,
  disableTokenSelect,
  selectors,
  account,
  factoryAddress,
  selectedTokenAddress = '',
  exchangeAddresses: { fromToken },
  addExchange,
  history,
  web3,
  transactions,
  pendingApprovals,
  value,
  addApprovalTx,
  addPendingTx
}) {
  const { t } = useTranslation()
  const context = useWeb3Context()
  const signerOrProvider = useSignerOrProvider()

  const inputRef = useRef()

  const [isShowingModal, setIsShowingModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingExchange, setLoadingExchange] = useState(false)

  useEffect(() => {
    if (inputRef.current && isShowingModal) {
      inputRef.current.focus()
    }
  }, [inputRef.current, isShowingModal])

  function createTokenList() {
    let tokens = tokenAddresses.addresses
    let tokenList = [{ value: 'ETH', label: 'ETH', address: 'ETH' }]

    for (let i = 0; i < tokens.length; i++) {
      let entry = { value: '', label: '' }
      entry.value = tokens[i][0]
      entry.label = tokens[i][0]
      entry.address = tokens[i][1]
      tokenList.push(entry)
      TOKEN_ADDRESS_TO_LABEL[tokens[i][1]] = tokens[i][0]
    }

    return tokenList.filter(({ address }) => !filteredTokens.includes(address))
  }

  function onTokenSelect(address) {
    setSearchQuery('')
    setIsShowingModal(false)

    onCurrencySelected(address)
  }

  function renderTokenList() {
    const tokens = createTokenList()

    if (loadingExchange) {
      return (
        <div className="token-modal__token-row token-modal__token-row--searching">
          <div className="loader" />
          <div>Searching for Exchange...</div>
        </div>
      )
    }

    if (isAddress(searchQuery)) {
      const tokenAddress = searchQuery
      const exchangeAddress = fromToken[tokenAddress]

      if (!exchangeAddress) {
        setLoadingExchange(true)

        getExchangeDetails(context.networkId, tokenAddress, signerOrProvider).then(async ({ exchangeAddress }) => {
          if (exchangeAddress !== ethers.constants.AddressZero) {
            const { symbol } = await getTokenDetails(tokenAddress, signerOrProvider)
            addExchange({
              tokenAddress,
              label: symbol,
              exchangeAddress
            })
          }
          setLoadingExchange(false)
        })
      }
    }

    if (disableTokenSelect) {
      return
    }

    let results

    if (!searchQuery) {
      results = tokens
    } else {
      const fuse = new Fuse(tokens, FUSE_OPTIONS)
      results = fuse.search(searchQuery)
    }

    if (!results.length && web3 && web3.utils && isAddress(searchQuery)) {
      const { label } = selectors().getBalance(account, searchQuery)
      return [
        <div key="token-modal-no-exchange" className="token-modal__token-row token-modal__token-row--no-exchange">
          <div>{t('noExchange')}</div>
        </div>,
        <div
          key="token-modal-create-exchange"
          className="token-modal__token-row token-modal__token-row--create-exchange"
          onClick={() => {
            setIsShowingModal(false)
            history.push(`/create-exchange/${searchQuery}`)
          }}
        >
          <div>{`Create exchange for ${label}`}</div>
        </div>
      ]
    }

    if (!results.length) {
      return (
        <div className="token-modal__token-row token-modal__token-row--no-exchange">
          <div>{t('noExchange')}</div>
        </div>
      )
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
    if (disableUnlock || !selectedTokenAddress || selectedTokenAddress === 'ETH') {
      return
    }

    const { value: allowance, decimals, label } = selectors().getApprovals(
      selectedTokenAddress,
      account,
      fromToken[selectedTokenAddress]
    )

    if (!label || (allowance.isGreaterThanOrEqualTo(BN((value || 0) * 10 ** decimals)) && !BN(allowance).isZero())) {
      return
    }
    const approvalTxId = pendingApprovals[selectedTokenAddress]
    if (approvalTxId && transactions.pending.includes(approvalTxId)) {
      return (
        <button className="currency-input-panel__sub-currency-select currency-input-panel__sub-currency-select--pending">
          <div className="loader" />
          {t('pending')}
        </button>
      )
    }

    return (
      <button
        className="currency-input-panel__sub-currency-select"
        onClick={() => {
          const contract = new web3.eth.Contract(ERC20_ABI, selectedTokenAddress)
          const amount = BN(10 ** decimals)
            .multipliedBy(10 ** 8)
            .toFixed(0)
          contract.methods.approve(fromToken[selectedTokenAddress], amount).send({ from: account }, (err, data) => {
            if (!err && data) {
              addPendingTx(data)
              addApprovalTx({ tokenAddress: selectedTokenAddress, txId: data })
            }
          })
        }}
      >
        {t('unlock')}
      </button>
    )
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
          {TOKEN_ADDRESS_TO_LABEL[selectedTokenAddress] || t('selectToken')}
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

export default withRouter(
  connect(
    state => ({
      factoryAddress: state.addresses.factoryAddress,
      exchangeAddresses: state.addresses.exchangeAddresses,
      tokenAddresses: state.addresses.tokenAddresses,
      contracts: state.contracts,
      account: state.web3connect.account,
      approvals: state.web3connect.approvals,
      transactions: state.web3connect.transactions,
      web3: state.web3connect.web3,
      pendingApprovals: state.pending.approvals
    }),
    dispatch => ({
      selectors: () => dispatch(selectors()),
      addExchange: opts => dispatch(addExchange(opts)),
      addPendingTx: opts => dispatch(addPendingTx(opts)),
      addApprovalTx: opts => dispatch(addApprovalTx(opts))
    })
  )(withTranslation()(CurrencyInputPanel))
)
