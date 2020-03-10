import React, { useState } from 'react'
import styled from 'styled-components'
import '@reach/tooltip/styles.css'
import { ethers } from 'ethers'
import { darken } from 'polished'
import { WETH } from '@uniswap/sdk'

import TokenLogo from '../TokenLogo'
import DoubleLogo from '../DoubleLogo'
import SearchModal from '../SearchModal'
import { Text } from 'rebass'
import { RowBetween } from '../Row'
import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { Input as NumericalInput } from '../NumericalInput'

import { useWeb3React } from '../../hooks'
import { useTranslation } from 'react-i18next'
import { useTokenContract } from '../../hooks'
import { calculateGasMargin } from '../../utils'
import { useAddressBalance } from '../../contexts/Balances'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'

const GAS_MARGIN = ethers.utils.bigNumberify(1000)

const SubCurrencySelect = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  padding: 4px 50px 4px 15px;
  margin-right: -40px;
  line-height: 0;
  align-items: center;
  border-radius: 2.5rem;
  height: 2rem;
  outline: none;
  cursor: pointer;
  user-select: none;
  background: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.royalBlue};
  color: ${({ theme }) => theme.royalBlue};
`

const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;

  padding: 0.75rem 0.85rem 0.75rem;
`

const CurrencySelect = styled.button`
  align-items: center;
  height: 2.2rem;

  font-size: 20px;
  background-color: ${({ selected, theme }) => (selected ? theme.buttonBackgroundPlain : theme.zumthorBlue)};
  color: ${({ selected, theme }) => (selected ? theme.textColor : theme.royalBlue)};
  border: 1px solid
    ${({ selected, theme, disableTokenSelect }) =>
      disableTokenSelect ? theme.buttonBackgroundPlain : selected ? theme.buttonOutlinePlain : theme.royalBlue};
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  user-select: none;

  :hover {
    border: 1px solid
      ${({ selected, theme }) => (selected ? darken(0.1, theme.outlineGrey) : darken(0.1, theme.royalBlue))};
  }

  :focus {
    border: 1px solid ${({ theme }) => darken(0.1, theme.royalBlue)};
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
    stroke: ${({ selected, theme }) => (selected ? theme.textColor : theme.royalBlue)};
  }
`

const InputPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.inputBackground};
  z-index: 1;
`

const Container = styled.div`
  border-radius: 1.25rem;
  border: 1px solid ${({ error, theme }) => (error ? theme.salmonRed : theme.mercuryGray)};

  background-color: ${({ theme }) => theme.inputBackground};
  :focus-within {
    border: 1px solid ${({ error, theme }) => (error ? theme.salmonRed : theme.malibuBlue)};
  }
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.doveGray)};
  }
`

const ErrorSpan = styled.span`
  color: ${({ error, theme }) => error && theme.salmonRed};
  :hover {
    cursor: pointer;
    color: ${({ error, theme }) => error && darken(0.1, theme.salmonRed)};
  }
`

const StyledTokenName = styled.span`
  margin: 0 0.25rem 0 0.75rem;
`

const ClickableText = styled.div`
  :hover {
    cursor: pointer;
  }
`

const StyledBalanceMax = styled.button`
  height: 30px;
  background-color: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.zumthorBlue};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.royalBlue};
  :hover {
    border: 1px solid ${({ theme }) => theme.royalBlue};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.royalBlue};
    outline: none;
  }
`

export default function CurrencyInputPanel({
  value,
  field,
  onUserInput,
  onTokenSelection = null,
  title,
  onMax,
  atMax,
  error,
  urlAddedTokens = [], // used
  token = null,
  showUnlock = false, // used to show unlock if approval needed
  disableUnlock = false,
  disableTokenSelect = false,
  hideBalance = false,
  isExchange = false,
  exchange = null, // used for double token logo
  customBalance = null // used for LP balances instead of token balance
}) {
  const { account, chainId } = useWeb3React()
  const { t } = useTranslation()
  const addTransaction = useTransactionAdder()

  const [modalOpen, setModalOpen] = useState(false)

  // this one causes the infinite loop
  const userTokenBalance = useAddressBalance(account, token)

  const tokenContract = useTokenContract(token?.address)
  const pendingApproval = usePendingApproval(token?.address)

  const routerAddress = '0xd9210Ff5A0780E083BB40e30d005d93a2DcFA4EF'

  function renderUnlockButton() {
    if (
      disableUnlock ||
      !showUnlock ||
      token?.address === 'ETH' ||
      token?.address === WETH[chainId].address ||
      !token?.address
    ) {
      return null
    } else {
      if (!pendingApproval) {
        return (
          <SubCurrencySelect
            onClick={async () => {
              let estimatedGas
              let useUserBalance = false
              estimatedGas = await tokenContract.estimate
                .approve(routerAddress, ethers.constants.MaxUint256)
                .catch(e => {
                  console.log('Error setting max token approval.')
                })
              if (!estimatedGas) {
                // general fallback for tokens who restrict approval amounts
                estimatedGas = await tokenContract.estimate.approve(routerAddress, userTokenBalance)
                useUserBalance = true
              }
              tokenContract
                .approve(routerAddress, useUserBalance ? userTokenBalance : ethers.constants.MaxUint256, {
                  gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
                })
                .then(response => {
                  addTransaction(response, { approval: token?.address })
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

  return (
    <InputPanel>
      <Container error={!!error}>
        {!hideBalance && (
          <LabelRow>
            <RowBetween>
              <Text>{title}</Text>
              <ErrorSpan data-tip={'Enter max'} error={!!error} onClick={() => {}}></ErrorSpan>
              <ClickableText onClick={onMax}>
                <Text>
                  Balance: {customBalance ? customBalance?.toSignificant(4) : userTokenBalance?.toSignificant(4)}
                </Text>
              </ClickableText>
            </RowBetween>
          </LabelRow>
        )}
        <InputRow>
          <NumericalInput field={field} value={value} onUserInput={onUserInput} />
          {!!token?.address && !atMax && <StyledBalanceMax onClick={onMax}>MAX</StyledBalanceMax>}
          {renderUnlockButton()}
          <CurrencySelect
            selected={!!token?.address}
            onClick={() => {
              if (!disableTokenSelect) {
                setModalOpen(true)
              }
            }}
            disableTokenSelect={disableTokenSelect}
          >
            <Aligner>
              {isExchange ? (
                <DoubleLogo a0={exchange?.token0.address} a1={exchange?.token1.address} size={24} margin={true} />
              ) : token?.address ? (
                <TokenLogo address={token?.address} size={'24px'} />
              ) : null}
              {isExchange ? (
                <StyledTokenName>
                  {exchange?.token0.symbol}:{exchange?.token1.symbol}
                </StyledTokenName>
              ) : (
                <StyledTokenName>{(token && token.symbol) || t('selectToken')}</StyledTokenName>
              )}
              {!disableTokenSelect && <StyledDropDown selected={!!token?.address} />}
            </Aligner>
          </CurrencySelect>
        </InputRow>
      </Container>
      {!disableTokenSelect && (
        <SearchModal
          isOpen={modalOpen}
          onDismiss={() => {
            setModalOpen(false)
          }}
          filterType="tokens"
          urlAddedTokens={urlAddedTokens}
          field={field}
          onTokenSelect={onTokenSelection}
        />
      )}
    </InputPanel>
  )
}
