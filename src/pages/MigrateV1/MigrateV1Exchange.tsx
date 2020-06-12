import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ChainId, Fraction, JSBI, Percent, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga'
import { Redirect, RouteComponentProps } from 'react-router'
import { ButtonConfirmed } from '../../components/Button'
import { PinkCard, YellowCard, LightCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow, RowBetween } from '../../components/Row'
import { Dots } from '../../components/swap/styleds'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE } from '../../constants'
import { MIGRATOR_ADDRESS } from '../../constants/abis/migrator'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV1ExchangeContract, useV2MigratorContract } from '../../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useIsTransactionPending, useTransactionAdder } from '../../state/transactions/hooks'
import { useETHBalances, useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { isAddress } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from './EmptyState'
import TokenLogo from '../../components/TokenLogo'
import { FormattedPoolTokenAmount } from './index'

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
  const isFirstLiquidityProvider: boolean = v2Pair === null

  const v2SpotPrice = v2Pair?.reserveOf(token)?.divide(v2Pair?.reserveOf(WETH[chainId as ChainId]))

  const [confirmingMigration, setConfirmingMigration] = useState<boolean>(false)
  const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)

  const shareFraction: Fraction = totalSupply ? new Percent(liquidityTokenAmount.raw, totalSupply.raw) : ZERO_FRACTION

  const ethWorth: Fraction = exchangeETHBalance
    ? new Fraction(shareFraction.multiply(exchangeETHBalance).quotient, WEI_DENOM)
    : ZERO_FRACTION

  const tokenWorth: TokenAmount = exchangeTokenBalance
    ? new TokenAmount(token, shareFraction.multiply(exchangeTokenBalance.raw).quotient)
    : new TokenAmount(token, ZERO)

  const [approval, approve] = useApproveCallback(liquidityTokenAmount, MIGRATOR_ADDRESS)

  const v1SpotPrice =
    exchangeTokenBalance && exchangeETHBalance
      ? exchangeTokenBalance.divide(new Fraction(exchangeETHBalance, WEI_DENOM))
      : null

  const priceDifferenceFraction: Fraction | undefined =
    v1SpotPrice && v2SpotPrice
      ? v1SpotPrice
          .divide(v2SpotPrice)
          .multiply('100')
          .subtract('100')
      : undefined

  const priceDifferenceAbs: Fraction | undefined = priceDifferenceFraction?.lessThan(ZERO)
    ? priceDifferenceFraction?.multiply('-1')
    : priceDifferenceFraction

  const minAmountETH: JSBI | undefined =
    v2SpotPrice && tokenWorth
      ? tokenWorth
          .divide(v2SpotPrice)
          .multiply(WEI_DENOM)
          .multiply(ALLOWED_OUTPUT_MIN_PERCENT).quotient
      : ethWorth?.numerator

  const minAmountToken: JSBI | undefined =
    v2SpotPrice && ethWorth
      ? ethWorth
          .multiply(v2SpotPrice)
          .multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(token.decimals)))
          .multiply(ALLOWED_OUTPUT_MIN_PERCENT).quotient
      : tokenWorth?.numerator

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
        ReactGA.event({
          category: 'Migrate',
          action: 'V1->V2',
          label: token?.symbol
        })

        addTransaction(response, {
          summary: `Migrate ${token.symbol} liquidity to V2`
        })
        setPendingMigrationHash(response.hash)
      })
      .catch(() => {
        setConfirmingMigration(false)
      })
  }, [minAmountToken, minAmountETH, migrator, token, account, addTransaction])

  const noLiquidityTokens = liquidityTokenAmount && liquidityTokenAmount.equalTo(ZERO)

  const largePriceDifference = Boolean(priceDifferenceAbs && !priceDifferenceAbs.lessThan(JSBI.BigInt(5)))

  const isSuccessfullyMigrated = Boolean(noLiquidityTokens && pendingMigrationHash)

  return (
    <AutoColumn gap="20px">
      {!isFirstLiquidityProvider ? (
        largePriceDifference ? (
          <YellowCard>
            <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
              It is best to deposit liquidity into Uniswap V2 at a price you believe is correct. If you believe the
              price is incorrect, you can either make a swap to move the price or wait for someone else to do so.
            </TYPE.body>
            <AutoColumn gap="8px">
              <RowBetween>
                <TYPE.body>V1 Price:</TYPE.body>
                <TYPE.black>
                  {v1SpotPrice?.toSignificant(6)} {token.symbol}/ETH
                </TYPE.black>
              </RowBetween>
              <RowBetween>
                <TYPE.body>V2 Price:</TYPE.body>
                <TYPE.black>
                  {v2SpotPrice?.toSignificant(6)} {token.symbol}/ETH
                </TYPE.black>
              </RowBetween>
              <RowBetween>
                <div>Price Difference:</div>
                <div>{priceDifferenceAbs.toSignificant(4)}%</div>
              </RowBetween>
            </AutoColumn>
          </YellowCard>
        ) : null
      ) : (
        <PinkCard>
          <AutoColumn gap="10px">
            <div>
              You are the first liquidity provider for this pair on Uniswap V2. Your liquidity will be migrated at the
              current V1 price. Your transaction cost also includes the gas to create the pool.
            </div>
            <div>V1 Price</div>
            <AutoColumn>
              <div>
                {v1SpotPrice?.invert()?.toSignificant(6)} ETH/{token.symbol}
              </div>
              <div>
                {v1SpotPrice?.toSignificant(6)} {token.symbol}/ETH
              </div>
            </AutoColumn>
          </AutoColumn>
        </PinkCard>
      )}
      <LightCard>
        <AutoRow style={{ justifyContent: 'flex-start', width: 'fit-content' }}>
          <TokenLogo size="24px" address={token.address} />{' '}
          <div style={{ marginLeft: '.75rem' }}>
            <TYPE.mediumHeader>
              {<FormattedPoolTokenAmount tokenAmount={liquidityTokenAmount} />} {token.symbol} Pool Tokens
            </TYPE.mediumHeader>
          </div>
        </AutoRow>
        <div style={{ display: 'flex', marginTop: '1rem' }}>
          <AutoColumn gap="12px" style={{ flex: '1', marginRight: 12 }}>
            <ButtonConfirmed
              confirmed={approval === ApprovalState.APPROVED}
              disabled={approval !== ApprovalState.NOT_APPROVED}
              onClick={approve}
            >
              {approval === ApprovalState.PENDING ? (
                <Dots>Approving</Dots>
              ) : approval === ApprovalState.APPROVED ? (
                'Approved'
              ) : (
                'Approve'
              )}
            </ButtonConfirmed>
          </AutoColumn>
          <AutoColumn gap="12px" style={{ flex: '1' }}>
            <ButtonConfirmed
              confirmed={isSuccessfullyMigrated}
              disabled={
                isSuccessfullyMigrated ||
                noLiquidityTokens ||
                isMigrationPending ||
                approval !== ApprovalState.APPROVED ||
                confirmingMigration
              }
              onClick={migrate}
            >
              {isSuccessfullyMigrated ? 'Success' : isMigrationPending ? 'Migrating...' : 'Migrate'}
            </ButtonConfirmed>
          </AutoColumn>
        </div>
      </LightCard>
      <TYPE.darkGray style={{ textAlign: 'center' }}>
        {'Your ' + token.symbol + ' liquidity will become Uniswap V2 ' + token.symbol + '/ETH liquidity.'}
      </TYPE.darkGray>
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

  const token = useToken(tokenAddress)

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
