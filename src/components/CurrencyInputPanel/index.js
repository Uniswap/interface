import React, { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import styled from 'styled-components'
import escapeStringRegex from 'escape-string-regexp'
import { lighten, darken } from 'polished'
import Tooltip from '@reach/tooltip'
import '@reach/tooltip/styles.css'
import { isMobile } from 'react-device-detect'

import { BorderlessInput } from '../../theme'
import { useTokenContract } from '../../hooks'
import { isAddress, calculateGasMargin } from '../../utils'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import Modal from '../Modal'
import TokenLogo from '../TokenLogo'
import SearchIcon from '../../assets/images/magnifying-glass.svg'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'
import { useTokenDetails, useAllTokenDetails } from '../../contexts/Tokens'

const GAS_MARGIN = ethers.utils.bigNumberify(1000)

const SubCurrencySelect = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  background: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.royalBlue};
  line-height: 0;
  height: 2rem;
  padding: 10px 50px 10px 15px;
  margin-right: -40px;
  border-radius: 2.5rem;
  outline: none;
  cursor: pointer;
  user-select: none;
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 0.25rem 0.85rem 0.75rem;
`

const Input = styled(BorderlessInput)`
  font-size: 1.5rem;
  color: ${({ error, theme }) => error && theme.salmonRed};
`

const StyledBorderlessInput = styled(BorderlessInput)`
  min-height: 1.75rem;
  flex-shrink: 0;
`

const CurrencySelect = styled.button`
  align-items: center;
  font-size: 1rem;
  color: ${({ selected, theme }) => (selected ? theme.black : theme.royalBlue)};
  height: 2rem;
  border: 1px solid ${({ selected, theme }) => (selected ? theme.mercuryGray : theme.royalBlue)};
  border-radius: 2.5rem;
  background-color: ${({ selected, theme }) => (selected ? theme.concreteGray : theme.zumthorBlue)};
  outline: none;
  cursor: pointer;
  user-select: none;

  :hover {
    border: 1px solid
      ${({ selected, theme }) => (selected ? darken(0.1, theme.mercuryGray) : darken(0.1, theme.royalBlue))};
  }

  :focus {
    box-shadow: 0 0 1px 1px ${({ theme }) => theme.malibuBlue};
  }

  :active {
    background-color: ${({ theme }) => theme.zumthorBlue};
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
    stroke: ${({ selected, theme }) => (selected ? theme.black : theme.royalBlue)};
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  box-shadow: 0 4px 8px 0 ${({ theme }) => lighten(0.9, theme.royalBlue)};
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.white};
  z-index: 1;
`

const Container = styled.div`
  border-radius: 1.25rem;
  box-shadow: 0 0 0 1px ${({ error, theme }) => (error ? theme.salmonRed : theme.mercuryGray)};
  background-color: ${({ theme }) => theme.white};
  transition: box-shadow 200ms ease-in-out;

  :focus-within {
    box-shadow: 0 0 1px 1px ${({ theme }) => theme.malibuBlue};
  }
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.doveGray)};
  }
`

const LabelContainer = styled.div`
  flex: 1 1 auto;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const ErrorSpan = styled.span`
  color: ${({ error, theme }) => error && theme.salmonRed};
  :hover {
    cursor: pointer;
    color: ${({ error, theme }) => error && darken(0.1, theme.salmonRed)};
  }
`

const TokenModal = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  background-color: ${({ theme }) => theme.white};
  width: 100%;
`

const SearchContainer = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.mercuryGray};
`

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
  padding: 1rem 1.5rem;
  margin: 0.25rem 0.5rem;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;

  #symbol {
    color: ${({ theme }) => theme.doveGrey};
  }

  :hover {
    background-color: ${({ theme }) => theme.concreteGray};
  }
`

const StyledTokenName = styled.span`
  margin: 0 0.25rem 0 0.25rem;
`

export default function CurrencyInputPanel({
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

  const [modalIsOpen, setModalIsOpen] = useState(false)

  const tokenContract = useTokenContract(selectedTokenAddress)
  const { exchangeAddress: selectedTokenExchangeAddress } = useTokenDetails(selectedTokenAddress)

  const pendingApproval = usePendingApproval(selectedTokenAddress)

  const addTransaction = useTransactionAdder()

  const allTokens = useAllTokenDetails()

  function renderUnlockButton() {
    if (disableUnlock || !showUnlock || selectedTokenAddress === 'ETH' || !selectedTokenAddress) {
      return null
    } else {
      if (!pendingApproval) {
        return (
          <SubCurrencySelect
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
                  addTransaction(response, { approval: selectedTokenAddress })
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

    return (
      <InputRow>
        <Input
          type="number"
          min="0"
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
          onTokenSelect={onCurrencySelected}
        />
      )}
    </InputPanel>
  )
}

function CurrencySelectModal({ isOpen, onDismiss, onTokenSelect }) {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const { exchangeAddress } = useTokenDetails(searchQuery)

  const allTokens = useAllTokenDetails()
  const tokenList = useMemo(() => {
    return Object.keys(allTokens)
      .sort((a, b) => {
        const aSymbol = allTokens[a].symbol.toLowerCase()
        const bSymbol = allTokens[b].symbol.toLowerCase()
        if (aSymbol === 'ETH'.toLowerCase() || bSymbol === 'ETH'.toLowerCase()) {
          return aSymbol === bSymbol ? 0 : aSymbol === 'ETH'.toLowerCase() ? -1 : 1
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

    return filteredTokenList.map(({ address, symbol }) => {
      return (
        <TokenModalRow key={address} onClick={() => _onTokenSelect(address)}>
          <TokenLogo address={address} />
          <span id="symbol">{symbol}</span>
        </TokenModalRow>
      )
    })
  }

  // manage focus on modal show
  const inputRef = useRef()

  function onInput(event) {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={50} initialFocusRef={isMobile ? undefined : inputRef}>
      <TokenModal>
        <SearchContainer>
          <StyledBorderlessInput ref={inputRef} type="text" placeholder={t('searchOrPaste')} onChange={onInput} />
          <img src={SearchIcon} alt="search" />
        </SearchContainer>
        <TokenList>{renderTokenList()}</TokenList>
      </TokenModal>
    </Modal>
  )
}
