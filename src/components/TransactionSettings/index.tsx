import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Ether, Percent } from '@uniswap/sdk-core'
import { L2_CHAIN_IDS } from 'constants/chains'
import { DEFAULT_DEADLINE_FROM_NOW, DEFAULT_USER_GAS_PRICE } from 'constants/misc'
import { useActiveWeb3React } from 'hooks/web3'
import JSBI from 'jsbi'
import { darken } from 'polished'
import { useContext, useState } from 'react'
import { useSetUserSlippageTolerance, useUserTransactionGas, useUserTransactionTTL } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

enum UserGasPriceError {
  InvalidInput = 'InvalidInput',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 36px;
  font-size: 1rem;
  width: auto;
  min-width: 3.5rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: ${({ theme }) => theme.bg1};
  :hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
`

const Option = styled(FancyButton)<{ active: boolean }>`
  margin-right: 8px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => active && theme.primary1};
  color: ${({ active, theme }) => (active ? theme.white : theme.text1)};
`

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  font-size: 16px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};
  text-align: right;
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 2rem;
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  border: ${({ theme, active, warning }) =>
    active ? `1px solid ${warning ? theme.red1 : theme.primary1}` : warning && `1px solid ${theme.red1}`};
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `1px solid ${warning ? darken(0.1, theme.red1) : darken(0.1, theme.primary1)}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;  
  `}
`

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TransactionSettingsProps {}

export default function TransactionSettings({}: TransactionSettingsProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [userGasPrice, setUserGasPrice] = useUserTransactionGas()

  const [userGasPriceInput, setUserGasPriceInput] = useState('')
  const [userGasPriceError, setUserGasPriceError] = useState<UserGasPriceError | false>(false)

  function parseCustomGasPrice(value: string) {
    // populate what the user typed and clear the error
    setUserGasPriceInput(value)
    setUserGasPriceError(false)

    if (value.length === 0) {
      setUserGasPrice(DEFAULT_USER_GAS_PRICE)
    } else {
      try {
        const parsed = parseUnits(value, 'gwei').toString()
        if (parsed !== '0' && chainId) {
          CurrencyAmount.fromRawAmount(Ether.onChain(chainId), JSBI.BigInt(parsed))
        }
        setUserGasPrice(value)
      } catch (error) {
        console.error(error)
        setUserGasPriceError(UserGasPriceError.InvalidInput)
      }
    }
  }

  const showCustomDeadlineRow = true

  return (
    <AutoColumn gap="md">
      {showCustomDeadlineRow && (
        <AutoColumn gap="sm">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              <Trans>Maximum gas price</Trans>
            </TYPE.black>
            <QuestionHelper
              text={
                <Trans>
                  Your limit order will be processed if your maximum gas price is GREATER than the network gas price.
                </Trans>
              }
            />
          </RowFixed>
          <RowFixed>
            <OptionCustom style={{ width: '80px' }} warning={!!userGasPriceError} tabIndex={-1}>
              <Input
                placeholder={DEFAULT_USER_GAS_PRICE.toString()}
                value={userGasPrice}
                onChange={(e) => parseCustomGasPrice(e.target.value)}
                onBlur={() => {
                  setUserGasPriceInput('')
                  setUserGasPriceError(false)
                }}
                color={userGasPriceError ? 'red' : ''}
              />
            </OptionCustom>
            <TYPE.body style={{ paddingLeft: '8px' }} fontSize={14}>
              <Trans>GWei</Trans>
            </TYPE.body>
          </RowFixed>
        </AutoColumn>
      )}
    </AutoColumn>
  )
}
