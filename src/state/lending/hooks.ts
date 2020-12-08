import { CToken, CTokenState, useCTokens } from '../../data/CToken'
import { useActiveWeb3React } from '../../hooks'
import { LendField, updateLendingToken } from './actions'
import { ChainId, CurrencyAmount, JSBI, TokenAmount } from '@uniswap/sdk'
import { tryParseAmount } from '../swap/hooks'
import { useTranslation } from 'react-i18next'
import store from 'state'
import { useMemo } from 'react'
import { BigNumber } from 'ethers'
import { LendingState } from './reducer'

// based on typed value
export function useLendingInfo(
  lendInputValue: string,
  lendToken: CToken | undefined,
  lendMarket: LendField | undefined,
  limit: JSBI,
  withdrawMax: CurrencyAmount | undefined,
  borrowMax: CurrencyAmount | undefined,
  walletBalance: JSBI | undefined
): {
  inputError?: boolean
  inputText?: string
} {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  // Wallet Balance
  let inputError = false
  let inputText: string | undefined

  if (!account) {
    inputError = true
    inputText = 'Connect Wallet'
  }
  if (!lendToken || inputError) {
    inputError = true
    inputText = inputText ?? 'Data Error'
    return { inputError, inputText }
  }

  const ZERO = JSBI.BigInt(0)
  // Protocol Balance
  const parseInputValue: CurrencyAmount | undefined = tryParseAmount(lendInputValue, lendToken)
  const protocolBorrowBalance = new TokenAmount(lendToken, lendToken.getBorrowBalanceAmount())
  const protocolSuppleyBalance = new TokenAmount(lendToken, lendToken.getSupplyBalanceAmount())
  const liquidity = new TokenAmount(lendToken, lendToken.getLiquidity())
  const liquidityValue = new TokenAmount(lendToken, lendToken.getLiquidityValue())
  if (lendMarket === LendField.SUPPLY && !inputError) {
    if (walletBalance) {
      if (!parseInputValue) {
        inputError = true
        inputText = t(lendMarket.toLowerCase())
      } else if (JSBI.equal(walletBalance, ZERO) || JSBI.greaterThan(parseInputValue.raw, walletBalance)) {
        inputError = true
        inputText = t('noFundsAvailable')
      } else {
        inputText = t(lendMarket.toLowerCase())
      }
    } else {
      inputError = true
      inputText = t('noFundsAvailable')
    }
  }

  if (lendMarket === LendField.WITHDRAW && !inputError) {
    if (protocolSuppleyBalance && withdrawMax) {
      if (JSBI.equal(protocolSuppleyBalance.raw, ZERO)) {
        inputError = true
        inputText = t('noBalanceToWithdraw')
      } else if (!parseInputValue) {
        inputError = true
        inputText = t(lendMarket.toLowerCase())
      } else if (withdrawMax.lessThan(parseInputValue)) {
        inputError = true
        inputText = t('tokenInsufficientLiquidity')
      } else {
        inputText = t(lendMarket.toLowerCase())
      }
    } else {
      inputError = true
      inputText = t('noBalanceToWithdraw')
    }
  }

  if (lendMarket === LendField.REPAY && !inputError) {
    if (!protocolBorrowBalance || JSBI.equal(protocolBorrowBalance.raw, ZERO)) {
      inputError = true
      inputText = t('noBalanceToRepay')
    } else if ((parseInputValue && JSBI.equal(parseInputValue.raw, ZERO)) || !parseInputValue) {
      inputError = true
      inputText = t(lendMarket.toLowerCase())
    } else if (JSBI.greaterThan(parseInputValue.raw, protocolBorrowBalance.raw)) {
      inputError = true
      inputText = t('Exceed borrow balance')
    } else if (walletBalance && JSBI.greaterThan(parseInputValue.raw, walletBalance)) {
      inputError = true
      inputText = t('noFundsAvailable')
    } else {
      inputText = t(lendMarket.toLowerCase())
    }
  }

  if (lendMarket === LendField.BORROW && !inputError) {
    if (JSBI.equal(limit, ZERO)) {
      inputError = true
      inputText = t('borrowingLimitReached')
    } else if (
      JSBI.equal(liquidityValue.raw, ZERO) ||
      (parseInputValue && JSBI.lessThan(liquidity.raw, parseInputValue.raw))
    ) {
      inputError = true
      inputText = t('tokenInsufficientLiquidity')
    } else if ((parseInputValue && JSBI.equal(parseInputValue.raw, ZERO)) || !parseInputValue) {
      inputError = true
      inputText = t(lendMarket.toLowerCase())
    } else if (borrowMax && parseInputValue && borrowMax.lessThan(parseInputValue)) {
      inputError = true
      inputText = t('insufficientCollateral')
    } else {
      inputText = t(lendMarket.toLowerCase())
    }
  }

  inputText = inputText ?? t(lendMarket?.toLowerCase())

  return { inputError, inputText }
}

export function listToCTokenMap(state: LendingState, chainId: ChainId): [CTokenState, CToken | null][] {
  return state[chainId].map(i => {
    const token = i[1] as CToken
    return [
      i[0],
      new CToken(
        chainId,
        token.cAddress,
        token.address,
        token.decimals,
        token.cSymbol,
        token.cName,
        token.symbol,
        token.name,
        BigNumber.from((token.supplyRatePerBlock as BigNumber)._hex),
        BigNumber.from((token.borrowRatePerBlock as BigNumber)._hex),
        BigNumber.from((token.balanceUnderlying as BigNumber)._hex),
        BigNumber.from((token.supplyBalance as BigNumber)._hex),
        BigNumber.from((token.borrowBalance as BigNumber)._hex),
        BigNumber.from((token.exchangeRateMantissa as BigNumber)._hex),
        BigNumber.from((token.totalSupply as BigNumber)._hex),
        BigNumber.from((token.liquidity as BigNumber)._hex),
        token.canBeCollateral,
        BigNumber.from((token.underlyingPrice as BigNumber)._hex),
        token.isListed,
        BigNumber.from((token.collateralFactorMantissa as BigNumber)._hex),
        token.logo0,
        token.logo1
      )
    ]
  })
}

export function useAllLendingMarket(): [CTokenState, CToken | null][] {
  const { chainId, account } = useActiveWeb3React()
  const markets = useCTokens()
  const state = store.getState().lending
  return useMemo(() => {
    if (account && chainId && markets[0][0] === CTokenState.EXISTS) {
      store.dispatch(updateLendingToken({ chainId, markets }))
      return markets
    }
    if (account && chainId && state[chainId].length) {
      try {
        return listToCTokenMap(state, chainId)
      } catch (error) {
        console.error('Could not show lending list due to error', error)
        return markets
      }
    }
    return markets
  }, [account, chainId, markets, state])
}
