import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import { BigNumber } from '@uniswap/sdk'
import styled from 'styled-components'
import escapeStringRegex from 'escape-string-regexp'
import Tooltip from '@reach/tooltip'
import '@reach/tooltip/styles.css'
import { isMobile } from 'react-device-detect'

import { BorderlessInput, Spinner } from '../../theme'
import { useTokenContract, useWeb3React } from '../../hooks'
import { calculateGasMargin, formatEthBalance, formatTokenBalance, formatToUsd, isAddress } from '../../utils'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import Modal from '../Modal'
import TokenLogo from '../TokenLogo'
import { usePendingApproval, useTransactionAdder } from '../../contexts/Transactions'
import {
  DELEGATE_ADDRESS,
  DMG_ADDRESS,
  PRIMARY,
  PRIMARY_DECIMALS,
  SECONDARY_DECIMALS,
  useAllTokenDetails,
  useTokenDetails,
  WETH_ADDRESS
} from '../../contexts/Tokens'
import { useAddressBalance, useAllBalances, useETHPriceInUSD } from '../../contexts/Balances'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import Circle from '../../assets/images/circle-grey.svg'
import * as Sentry from '@sentry/browser'

const GAS_MARGIN = ethers.BigNumber.from(1000)

const SubCurrencySelect = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  padding: 4px 50px 4px 15px;
  margin-right: -40px;
  line-height: 0;
  height: 2rem;
  align-items: center;
  border-radius: 2.5rem;
  outline: none;
  cursor: pointer;
  user-select: none;
  background-color: #e0e0e0;
  color: #000000;
  border: 1px solid #000000;
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;

  padding: 0.25rem 0.85rem 0.75rem;
`

const Input = styled(BorderlessInput)`
  font-size: 1.5rem;
  color: #000000;
  background-color: #ffffff;
  -moz-appearance: textfield;
`

// const StyledBorderlessInput = styled(BorderlessInput)`
//   min-height: 2.5rem;
//   flex-shrink: 0;
//   text-align: left;
//   padding-left: 1.6rem;
//   background-color: #FFFFFF;
//   color: #000000;
// `

const CurrencySelect = styled.button`
  align-items: center;
  font-size: 1rem;
  color: ${({ selected, theme }) => (selected ? theme.textColor : theme.royalBlue)};
  height: 2rem;
  border-radius: 2.5rem;
  background-color: #ffffff;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: 1px solid black;

  :hover {
  }

  :focus {
  }

  :active {
    background-color: #c6c6c6;
  }
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledDropDown = styled(DropDown)`
  margin: 0 0.5rem 0 0.5rem;
  height: 35%;

  path {
    stroke: #000000;
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  box-shadow: 1px 1px 8px -4px rgba(0,0,0,.5), 1px 1px 4px -4px rgba(0,0,0,.5);
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.inputBackground};
  z-index: 1;
`

const Container = styled.div`
  border-radius: 1.25rem;

  background-color: #ffffff;
  :focus-within {
  }
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: #000000 !important;
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem;
`

const LabelContainer = styled.div`
  flex: 1 1 auto;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const ErrorSpan = styled.span`
  color: #000000s;
  :hover {
    cursor: pointer;
    color: #444444;
  }
`

const TokenModal = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  width: 100%;
`

const ModalHeader = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px 0px 0px 1rem;
  height: 60px;
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.textColor};
  }
`

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

// const SearchContainer = styled.div`
//   ${({ theme }) => theme.flexRowNoWrap}
//   justify-content: flex-start;
//   padding: 0.5rem 1.5rem;
//   background-color: #FFFFFF;
// `

const TokenModalInfo = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 1rem 1.5rem;
  margin: 0.25rem 0.5rem;
  justify-content: center;
  user-select: none;
`

const TokenList = styled.div`
  flex-grow: 1;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`

const TokenModalRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  user-select: none;

  #symbol {
    color: ${({ theme }) => theme.doveGrey};
  }

  :hover {
    background-color: #e0e0e0;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0.8rem 1rem;
    padding-right: 2rem;
  `}
`

const TokenRowLeft = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items : center;
`

const TokenSymbolGroup = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  margin-left: 1rem;
`

const TokenFullName = styled.div`
  color: ${({ theme }) => theme.chaliceGray};
`

// const FadedSpan = styled.span`
//   color: ${({ theme }) => theme.royalBlue};
// `

const TokenRowBalance = styled.div`
  font-size: 1rem;
  line-height: 20px;
`

const TokenRowUsd = styled.div`
  font-size: 1rem;
  line-height: 1.5rem;
  color: ${({ theme }) => theme.chaliceGray};
`

const TokenRowRight = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: flex-end;
`

const StyledTokenName = styled.span`
  margin: 0 0.25rem 0 0.25rem;
  color: #000000;
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
  color: ${({ theme }) => theme.chaliceGray};
  opacity: 0.6;
`

export default function CurrencyInputPanel({
  onValueChange = () => {},
  allBalances,
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
  value,
  urlAddedTokens,
  hideETH = false,
  market,
  tokenAddress
}) {
  const { t } = useTranslation()

  const [modalIsOpen, setModalIsOpen] = useState(false)

  const tokenContract = useTokenContract(selectedTokenAddress === 'ETH' ? WETH_ADDRESS : selectedTokenAddress)

  const pendingApproval = usePendingApproval(selectedTokenAddress)

  const addTransaction = useTransactionAdder()

  const allTokens = useAllTokenDetails()

  const { account } = useWeb3React()

  const userTokenBalance = useAddressBalance(account, selectedTokenAddress)

  function renderUnlockButton() {
    if (disableUnlock || !showUnlock || !selectedTokenAddress) {
      return null
    } else {
      if (!pendingApproval) {
        return (
          <SubCurrencySelect
            onClick={async () => {
              let estimatedGas
              let useUserBalance = false
              estimatedGas = await tokenContract.estimateGas
                .approve(DELEGATE_ADDRESS, ethers.constants.MaxUint256)
                .catch(error => {
                  console.error('Error setting max token approval ', error)
                })
              if (!estimatedGas) {
                // general fallback for tokens who restrict approval amounts
                estimatedGas = await tokenContract.estimateGas.approve(DELEGATE_ADDRESS, userTokenBalance)
                useUserBalance = true
              }
              tokenContract
                .approve(DELEGATE_ADDRESS, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                  gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                })
                .then(response => {
                  addTransaction(response, { approval: selectedTokenAddress })
                })
                .catch(error => {
                  if(error?.code !== 4001) {
                    console.error(`Could not approve ${tokenAddress} due to error: `, error)
                    Sentry.captureException(error)
                  } else {
                    console.log('Could not approve tokens because the txn was cancelled')
                  }
                })
            }}
          >
            {t('unlock')}
          </SubCurrencySelect>
        )
      } else {
        return <SubCurrencySelect>{t('pending')}</SubCurrencySelect>
      }
    }
  }

  function _renderInput() {
    if (typeof renderInput === 'function') {
      return renderInput()
    }

    const decimals = market[PRIMARY] === tokenAddress ? market[PRIMARY_DECIMALS] : market[SECONDARY_DECIMALS]

    const min = '0.' + '0'.repeat(decimals - 1) + '1'

    return (
      <InputRow>
        <Input
          type="number"
          min={min}
          step={min}
          error={!!errorMessage}
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
        <CurrencySelect
          selected={!!selectedTokenAddress}
          onClick={() => {
            if (!disableTokenSelect) {
              setModalIsOpen(true)
            }
          }}
        >
          <Aligner>
            {selectedTokenAddress ? <TokenLogo address={selectedTokenAddress} /> : null}
            {
              <StyledTokenName>
                {(allTokens[selectedTokenAddress] && allTokens[selectedTokenAddress].symbol) || t('selectToken')}
              </StyledTokenName>
            }
            {!disableTokenSelect && <StyledDropDown selected={!!selectedTokenAddress} />}
          </Aligner>
        </CurrencySelect>
      </InputRow>
    )
  }

  return (
    <InputPanel>
      <Container error={!!errorMessage}>
        <LabelRow>
          <LabelContainer>
            <span>{title}</span> <span>{description}</span>
          </LabelContainer>

          <ErrorSpan
            data-tip={'Enter max'}
            error={!!errorMessage}
            onClick={() => {
              extraTextClickHander()
            }}
          >
            <Tooltip
              label="Enter Max"
              style={{
                background: 'hsla(0, 0%, 0%, 0.75)',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                padding: '0.5em 1em',
                marginTop: '-64px'
              }}
            >
              <span>{extraText}</span>
            </Tooltip>
          </ErrorSpan>
        </LabelRow>
        {_renderInput()}
      </Container>
      {!disableTokenSelect && (
        <CurrencySelectModal
          isOpen={modalIsOpen}
          onDismiss={() => {
            setModalIsOpen(false)
          }}
          urlAddedTokens={urlAddedTokens}
          onTokenSelect={onCurrencySelected}
          allBalances={allBalances}
          hideETH={hideETH}
        />
      )}
    </InputPanel>
  )
}

function CurrencySelectModal({ isOpen, onDismiss, onTokenSelect, urlAddedTokens, hideETH }) {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const { exchangeAddress } = useTokenDetails(searchQuery)

  const allTokens = useAllTokenDetails()
  Object.keys(useAllTokenDetails()).forEach(token => {
    if (token === DMG_ADDRESS) {
      delete allTokens[token]
    }
  })

  const { account } = useWeb3React()

  // BigNumber.js instance
  const ethPrice = useETHPriceInUSD()

  // all balances for both account and exchanges
  const allBalances = useAllBalances()

  const _usdAmounts = Object.keys(allTokens).map(k => {
    if (ethPrice && allBalances[account] && allBalances[account][k] && allBalances[account][k].value) {
      let ethRate = 1 // default for ETH
      let exchangeDetails = allBalances[allTokens[k].exchangeAddress]

      if (
        exchangeDetails &&
        exchangeDetails[k] &&
        exchangeDetails[k].value &&
        exchangeDetails['ETH'] &&
        exchangeDetails['ETH'].value
      ) {
        const tokenBalance = new BigNumber(exchangeDetails[k].value)
        const ethBalance = new BigNumber(exchangeDetails['ETH'].value)
        ethRate = ethBalance
          .times(new BigNumber(10).pow(allTokens[k].decimals))
          .div(tokenBalance)
          .div(new BigNumber(10).pow(18))
      }
      const USDRate = ethPrice.times(ethRate)

      const balanceBigNumber = new BigNumber(allBalances[account][k].value)

      return balanceBigNumber.times(USDRate).div(new BigNumber(10).pow(allTokens[k].decimals))
    } else {
      return null
    }
  })
  const usdAmounts =
    _usdAmounts &&
    Object.keys(allTokens).reduce(
      (accumulator, currentValue, i) => Object.assign({ [currentValue]: _usdAmounts[i] }, accumulator),
      {}
    )

  const tokenList = useMemo(() => {
    return Object.keys(allTokens)
      .sort((a, b) => {
        if (allTokens[a].symbol && allTokens[b].symbol) {
          const aSymbol = allTokens[a].symbol.toLowerCase()
          const bSymbol = allTokens[b].symbol.toLowerCase()

          // pin ETH to top
          if (aSymbol === 'ETH'.toLowerCase() || bSymbol === 'ETH'.toLowerCase()) {
            return aSymbol === bSymbol ? 0 : aSymbol === 'ETH'.toLowerCase() ? -1 : 1
          }

          // then tokens with balance
          if (usdAmounts[a] && !usdAmounts[b]) {
            return -1
          } else if (usdAmounts[b] && !usdAmounts[a]) {
            return 1
          }

          // sort by balance
          if (usdAmounts[a] && usdAmounts[b]) {
            const aUSD = usdAmounts[a]
            const bUSD = usdAmounts[b]

            return aUSD.gt(bUSD) ? -1 : aUSD.lt(bUSD) ? 1 : 0
          }

          // sort alphabetically
          return aSymbol < bSymbol ? -1 : aSymbol > bSymbol ? 1 : 0
        } else {
          return 0
        }
      })
      .map(k => {
        let balance
        let usdBalance
        // only update if we have data
        if (k === 'ETH' && allBalances[account] && allBalances[account][k] && allBalances[account][k].value) {
          balance = formatEthBalance(ethers.BigNumber.from(allBalances[account][k].value))
          usdBalance = usdAmounts[k]
        } else if (allBalances[account] && allBalances[account][k] && allBalances[account][k].value) {
          balance = formatTokenBalance(ethers.BigNumber.from(allBalances[account][k].value), allTokens[k].decimals)
          usdBalance = usdAmounts[k]
        }
        return {
          name: allTokens[k].name,
          symbol: allTokens[k].symbol,
          address: k,
          balance: balance,
          usdBalance: usdBalance
        }
      })
  }, [allBalances, allTokens, usdAmounts, account])

  const filteredTokenList = useMemo(() => {
    const list = tokenList.filter(tokenEntry => {
      const inputIsAddress = searchQuery.slice(0, 2) === '0x'

      // check the regex for each field
      const regexMatches = Object.keys(tokenEntry).map(tokenEntryKey => {
        // if address field only search if input starts with 0x
        if (tokenEntryKey === 'address') {
          return (
            inputIsAddress &&
            tokenEntry[tokenEntryKey].toLowerCase() !== DMG_ADDRESS.toLowerCase() &&
            typeof tokenEntry[tokenEntryKey] === 'string' &&
            !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
          )
        }
        return (
          typeof tokenEntry[tokenEntryKey] === 'string' &&
          !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
        )
      })
      return regexMatches.some(m => m)
    })
    // If the user has not inputted anything, preserve previous sort
    if (searchQuery === '') return list
    return list.sort((a, b) => {
      return a.symbol.toLowerCase() === searchQuery.toLowerCase() ? -1 : 1
    })
  }, [tokenList, searchQuery])

  function _onTokenSelect(address) {
    setSearchQuery('')
    onTokenSelect(address)
    onDismiss()
  }

  function renderTokenList() {
    if (isAddress(searchQuery) && exchangeAddress === undefined) {
      return <TokenModalInfo>Searching for Exchange...</TokenModalInfo>
    }
    if (isAddress(searchQuery) && exchangeAddress === ethers.constants.AddressZero) {
      return (
        <>
          <TokenModalInfo>{t('noExchange')}</TokenModalInfo>
          <TokenModalInfo>
            <Link to={`/create-exchange/${searchQuery}`}>{t('createExchange')}</Link>
          </TokenModalInfo>
        </>
      )
    }
    if (!filteredTokenList.length) {
      return <TokenModalInfo>{t('noExchange')}</TokenModalInfo>
    }

    return filteredTokenList.map(({ address, symbol, name, balance, usdBalance }) => {
      if (hideETH && address === 'ETH') {
        return null
      }

      return (
        <TokenModalRow key={address} onClick={() => _onTokenSelect(address)}>
          <TokenRowLeft>
            <TokenLogo address={address} size={'2rem'} />
            <TokenSymbolGroup>
              <div>
                <span id="symbol">{symbol}</span>
              </div>
              <TokenFullName> {name}</TokenFullName>
            </TokenSymbolGroup>
          </TokenRowLeft>
          <TokenRowRight>
            {balance ? (
              <TokenRowBalance>{balance && (balance > 0 || balance === '<0.0001') ? balance : '-'}</TokenRowBalance>
            ) : account ? (
              <SpinnerWrapper src={Circle} alt="loader" />
            ) : (
              '-'
            )}
            <TokenRowUsd>
              {usdBalance && !usdBalance.isNaN()
                ? usdBalance.isZero()
                  ? ''
                  : usdBalance.lt(0.01)
                  ? '<$0.01'
                  : '$' + formatToUsd(usdBalance)
                : ''}
            </TokenRowUsd>
          </TokenRowRight>
        </TokenModalRow>
      )
    })
  }

  // // manage focus on modal show
  // const inputRef = useRef()
  //
  // function onInput(event) {
  //   const input = event.target.value
  //   const checksummedInput = isAddress(input)
  //   setSearchQuery(checksummedInput || input)
  // }

  function clearInputAndDismiss() {
    setSearchQuery('')
    onDismiss()
  }

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={clearInputAndDismiss}
      minHeight={60}
      maxHeight={50}
      // initialFocusRef={isMobile ? undefined : inputRef} // This can be uncommented if the search bar is added back
      initialFocusRef={isMobile ? undefined : undefined} // This can be deleted
    >
      <TokenModal>
        <ModalHeader>
          <p>{t('selectToken')}</p>
          <CloseIcon onClick={clearInputAndDismiss}>
            <CloseColor alt={'close icon'} />
          </CloseIcon>
        </ModalHeader>
        {/* Not needed since we only support 3 tokens */}
        {/*<SearchContainer>*/}
        {/*  <img src={SearchIcon} alt="search" />*/}
        {/*  <StyledBorderlessInput*/}
        {/*    ref={inputRef}*/}
        {/*    type="text"*/}
        {/*    placeholder={isMobile ? t('searchOrPasteMobile') : t('searchOrPaste')}*/}
        {/*    onChange={onInput}*/}
        {/*  />*/}
        {/*</SearchContainer>*/}
        <TokenList>{renderTokenList()}</TokenList>
      </TokenModal>
    </Modal>
  )
}
