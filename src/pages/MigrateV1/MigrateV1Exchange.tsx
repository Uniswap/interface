import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ChainId, Fraction, JSBI, Percent, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Redirect, RouteComponentProps } from 'react-router'
import { ButtonConfirmed, ButtonPrimary } from '../../components/Button'
import { YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow } from '../../components/Row'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE } from '../../constants'
import { MIGRATOR_ADDRESS } from '../../constants/abis/migrator'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV1ExchangeContract, useV2MigratorContract } from '../../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useIsTransactionPending, useTransactionAdder } from '../../state/transactions/hooks'
import { useETHBalances, useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { isAddress } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from './EmptyState'

const WEI_DENOM = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const ZERO_FRACTION = new Fraction(ZERO, ONE)
const ALLOWED_OUTPUT_MIN_PERCENT = new Percent(JSBI.BigInt(10000 - INITIAL_ALLOWED_SLIPPAGE), JSBI.BigInt(10000))

function V1PairMigration({ liquidityTokenAmount, token }: { liquidityTokenAmount: TokenAmount; token: Token }) {
  const { account, chainId } = useActiveWeb3React()
  const totalSupply = useTotalSupply(liquidityTokenAmount.token)
  const exchangeETHBalance = useETHBalances([liquidityTokenAmount.token.address])?.[liquidityTokenAmount.token.address]
  const exchangeTokenBalance = useTokenBalance(liquidityTokenAmount.token.address, token)

  const v2Pair = usePair(WETH[chainId as ChainId], token)

  const v2SpotPrice = v2Pair?.reserveOf(token)?.divide(v2Pair?.reserveOf(WETH[chainId as ChainId]))

  const [confirmingMigration, setConfirmingMigration] = useState<boolean>(false)
  const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)

  const sharePercent =
    exchangeETHBalance && totalSupply ? new Percent(liquidityTokenAmount.raw, totalSupply.raw) : ZERO_FRACTION

  const ethWorth: Fraction = exchangeETHBalance
    ? new Fraction(sharePercent.multiply(exchangeETHBalance).quotient, WEI_DENOM)
    : ZERO_FRACTION

  const tokenWorth: TokenAmount = exchangeTokenBalance
    ? new TokenAmount(token, sharePercent.multiply(exchangeTokenBalance.raw).quotient)
    : new TokenAmount(token, ZERO)

  const [approval, approve] = useApproveCallback(liquidityTokenAmount, MIGRATOR_ADDRESS)

  const v1SpotPrice =
    exchangeTokenBalance && exchangeETHBalance
      ? exchangeTokenBalance.divide(new Fraction(exchangeETHBalance, WEI_DENOM))
      : null

  const priceDifference: Fraction | undefined =
    v1SpotPrice && v2SpotPrice
      ? v1SpotPrice
          .divide(v2SpotPrice)
          .multiply('100')
          .subtract('100')
      : undefined

  const priceDifferenceAbs: Fraction | undefined = priceDifference?.lessThan(ZERO)
    ? priceDifference?.multiply('-1')
    : priceDifference

  const minAmountETH =
    v2SpotPrice && tokenWorth
      ? tokenWorth
          .divide(v2SpotPrice)
          .multiply(WEI_DENOM)
          .multiply(ALLOWED_OUTPUT_MIN_PERCENT).quotient
      : undefined

  const minAmountToken =
    v2SpotPrice && ethWorth
      ? ethWorth
          .multiply(v2SpotPrice)
          .multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(token.decimals)))
          .multiply(ALLOWED_OUTPUT_MIN_PERCENT).quotient
      : undefined

  const addTransaction = useTransactionAdder()
  const isMigrationPending = useIsTransactionPending(pendingMigrationHash)

  const migrator = useV2MigratorContract()
  const migrate = useCallback(() => {
    if (!minAmountToken || !minAmountETH) return

    setConfirmingMigration(true)
    migrator
      .migrate(
        token.address,
        minAmountToken.toString(),
        minAmountETH.toString(),
        account,
        Math.floor(new Date().getTime() / 1000) + DEFAULT_DEADLINE_FROM_NOW
      )
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: `Migrate ${token.symbol} liquidity to V2`
        })
        setPendingMigrationHash(response.hash)
      })
      .catch(() => {
        setConfirmingMigration(false)
      })
  }, [minAmountToken, minAmountETH, migrator, token.address, token.symbol, account, addTransaction])

  const noLiquidityTokens = liquidityTokenAmount && liquidityTokenAmount.equalTo(ZERO)

  return (
    <AutoColumn gap="20px">
      <YellowCard>
        <TYPE.main style={{ marginBottom: 8 }}>
          It is best to deposit liquidity into Uniswap V2 at a price you believe is correct. If you believe the price is
          incorrect, you can either make a swap to move the price or wait for someone else to do so.
        </TYPE.main>
        <AutoRow style={{ justifyContent: 'space-around' }}>
          <AutoColumn>
            <TYPE.body>
              V1 Price: {v1SpotPrice?.toSignificant(6)} {token.symbol}/ETH
            </TYPE.body>
            <TYPE.body>
              V2 Price: {v2SpotPrice?.toSignificant(6)} {token.symbol}/ETH
            </TYPE.body>
          </AutoColumn>
          <AutoColumn>
            <div>Price Difference</div>
            <div>{priceDifferenceAbs?.toSignificant(6)}%</div>
          </AutoColumn>
        </AutoRow>
      </YellowCard>
      <div style={{ display: 'flex' }}>
        <AutoColumn gap="8px" style={{ flex: '1', marginRight: 12 }}>
          <TYPE.mediumHeader>
            <span>Step 1</span>
            <QuestionHelper text="Before you can migrate your liquidity, you must approve the liquidity tokens to be moved by the Uniswap V2 migration contract." />
          </TYPE.mediumHeader>
          <ButtonConfirmed
            confirmed={approval === ApprovalState.APPROVED}
            disabled={approval !== ApprovalState.NOT_APPROVED}
            onClick={approve}
          >
            {approval === ApprovalState.PENDING
              ? 'Approving...'
              : approval === ApprovalState.APPROVED
              ? 'Approved'
              : 'Approve'}
          </ButtonConfirmed>
        </AutoColumn>
        <AutoColumn gap="8px" style={{ flex: '1' }}>
          <TYPE.mediumHeader>
            <span>Step 2</span>
            <QuestionHelper text="Migrate your liquidity to Uniswap V2!" />
          </TYPE.mediumHeader>
          <ButtonPrimary
            disabled={
              noLiquidityTokens || isMigrationPending || approval !== ApprovalState.APPROVED || confirmingMigration
            }
            onClick={migrate}
          >
            {isMigrationPending ? 'Migrating...' : 'Migrate'}
          </ButtonPrimary>
        </AutoColumn>
      </div>
    </AutoColumn>
  )
}

export default function MigrateV1Exchange({
  history,
  match: {
    params: { address }
  }
}: RouteComponentProps<{ address: string }>) {
  const validated = isAddress(address)
  const { chainId, account } = useActiveWeb3React()

  const exchangeContract = useV1ExchangeContract(validated ? validated : undefined)

  const tokenAddress = useSingleCallResult(exchangeContract, 'tokenAddress', undefined, NEVER_RELOAD)?.result?.[0]

  const token = useTokenByAddressAndAutomaticallyAdd(tokenAddress)

  const liquidityToken: Token | undefined = useMemo(
    () => (validated && token ? new Token(chainId, validated, 18, `UNI-V1-${token.symbol}`) : undefined),
    [chainId, token, validated]
  )

  const userLiquidityBalance = useTokenBalance(account, liquidityToken)

  const handleBack = useCallback(() => {
    history.push('/migrate/v1')
  }, [history])

  if (!validated) {
    console.error('Invalid address in path', address)
    return <Redirect to="/migrate/v1" />
  }

  if (!account) {
    return (
      <BodyWrapper>
        <TYPE.largeHeader>You must connect an account.</TYPE.largeHeader>
      </BodyWrapper>
    )
  }

  return (
    <BodyWrapper style={{ padding: 24 }}>
      <AutoColumn gap="16px">
        <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
          <div style={{ cursor: 'pointer' }}>
            <ArrowLeft onClick={handleBack} />
          </div>
          <TYPE.mediumHeader>Migrate {token?.symbol} Pool Tokens</TYPE.mediumHeader>
          <div>
            <QuestionHelper text="Migrate your liquidity tokens from Uniswap V1 to Uniswap V2." />
          </div>
        </AutoRow>

        {userLiquidityBalance && token ? (
          <V1PairMigration liquidityTokenAmount={userLiquidityBalance} token={token} />
        ) : (
          <EmptyState message="Loading..." />
        )}
      </AutoColumn>
    </BodyWrapper>
  )
}
