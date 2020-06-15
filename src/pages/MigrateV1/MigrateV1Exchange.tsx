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
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
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
import { TYPE, ExternalLink } from '../../theme'
import { isAddress, getEtherscanLink } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from './EmptyState'
import TokenLogo from '../../components/TokenLogo'
import { AddressZero } from '@ethersproject/constants'
import { Text } from 'rebass'

const POOL_TOKEN_AMOUNT_MIN = new Fraction(JSBI.BigInt(1), JSBI.BigInt(1000000))
const WEI_DENOM = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const ZERO_FRACTION = new Fraction(ZERO, ONE)
const ALLOWED_OUTPUT_MIN_PERCENT = new Percent(JSBI.BigInt(10000 - INITIAL_ALLOWED_SLIPPAGE), JSBI.BigInt(10000))

function FormattedPoolTokenAmount({ tokenAmount }: { tokenAmount: TokenAmount }) {
  return (
    <>
      {tokenAmount.equalTo(JSBI.BigInt(0))
        ? '0'
        : tokenAmount.greaterThan(POOL_TOKEN_AMOUNT_MIN)
        ? tokenAmount.toSignificant(4)
        : `<${POOL_TOKEN_AMOUNT_MIN.toSignificant(1)}`}
    </>
  )
}

export function V1LiquidityInfo({
  token,
  liquidityTokenAmount,
  tokenWorth,
  ethWorth
}: {
  token: Token
  liquidityTokenAmount: TokenAmount
  tokenWorth: TokenAmount
  ethWorth: Fraction
}) {
  const { chainId } = useActiveWeb3React()

  return (
    <>
      <AutoRow style={{ justifyContent: 'flex-start', width: 'fit-content' }}>
        <TokenLogo size="24px" address={token.address} />
        <div style={{ marginLeft: '.75rem' }}>
          <TYPE.mediumHeader>
            {<FormattedPoolTokenAmount tokenAmount={liquidityTokenAmount} />}{' '}
            {token.equals(WETH[chainId]) ? 'WETH' : token.symbol}/ETH
          </TYPE.mediumHeader>
        </div>
      </AutoRow>

      <RowBetween my="1rem">
        <Text fontSize={16} fontWeight={500}>
          Pooled {token.equals(WETH[chainId]) ? 'WETH' : token.symbol}:
        </Text>
        <RowFixed>
          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
            {tokenWorth.toSignificant(4)}
          </Text>
          <TokenLogo size="20px" style={{ marginLeft: '8px' }} address={token.address} />
        </RowFixed>
      </RowBetween>
      <RowBetween mb="1rem">
        <Text fontSize={16} fontWeight={500}>
          Pooled ETH:
        </Text>
        <RowFixed>
          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
            {ethWorth.toSignificant(4)}
          </Text>
          <TokenLogo size="20px" style={{ marginLeft: '8px' }} address={WETH[chainId].address} />
        </RowFixed>
      </RowBetween>
    </>
  )
}

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

  const noLiquidityTokens = !!liquidityTokenAmount && liquidityTokenAmount.equalTo(ZERO)

  const largePriceDifference = !!priceDifferenceAbs && !priceDifferenceAbs.lessThan(JSBI.BigInt(5))

  const isSuccessfullyMigrated = !!pendingMigrationHash && !!noLiquidityTokens

  return (
    <AutoColumn gap="20px">
      <TYPE.body my={9} style={{ fontWeight: 400 }}>
        This tool will safely migrate your V1 liquidity to V2 with minimal price risk. The process is completely
        trustless thanks to the{' '}
        <ExternalLink href={getEtherscanLink(chainId, MIGRATOR_ADDRESS, 'address')}>
          <TYPE.blue display="inline">Uniswap migration contract↗</TYPE.blue>
        </ExternalLink>
        .
      </TYPE.body>

      {!isFirstLiquidityProvider && largePriceDifference ? (
        <YellowCard>
          <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
            It{"'"}s best to deposit liquidity into Uniswap V2 at a price you believe is correct. If the V2 price seems
            incorrect, you can either make a swap to move the price or wait for someone else to do so.
          </TYPE.body>
          <AutoColumn gap="8px">
            <RowBetween>
              <TYPE.body>V1 Price:</TYPE.body>
              <TYPE.black>
                {v1SpotPrice?.toSignificant(6)} {token.symbol}/ETH
              </TYPE.black>
            </RowBetween>
            <RowBetween>
              <div />
              <TYPE.black>
                {v1SpotPrice?.invert()?.toSignificant(6)} ETH/{token.symbol}
              </TYPE.black>
            </RowBetween>

            <RowBetween>
              <TYPE.body>V2 Price:</TYPE.body>
              <TYPE.black>
                {v2SpotPrice?.toSignificant(6)} {token.symbol}/ETH
              </TYPE.black>
            </RowBetween>
            <RowBetween>
              <div />
              <TYPE.black>
                {v2SpotPrice?.invert()?.toSignificant(6)} ETH/{token.symbol}
              </TYPE.black>
            </RowBetween>

            <RowBetween>
              <TYPE.body color="inherit">Price Difference:</TYPE.body>
              <TYPE.black color="inherit">{priceDifferenceAbs.toSignificant(4)}%</TYPE.black>
            </RowBetween>
          </AutoColumn>
        </YellowCard>
      ) : null}

      {isFirstLiquidityProvider && (
        <PinkCard>
          <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
            You are the first liquidity provider for this pair on Uniswap V2. Your liquidity will be migrated at the
            current V1 price. Your transaction cost also includes the gas to create the pool.
          </TYPE.body>

          <AutoColumn gap="8px">
            <RowBetween>
              <TYPE.body>V1 Price:</TYPE.body>
              <TYPE.black>
                {v1SpotPrice?.toSignificant(6)} {token.symbol}/ETH
              </TYPE.black>
            </RowBetween>
            <RowBetween>
              <div />
              <TYPE.black>
                {v1SpotPrice?.invert()?.toSignificant(6)} ETH/{token.symbol}
              </TYPE.black>
            </RowBetween>
          </AutoColumn>
        </PinkCard>
      )}

      <LightCard>
        <V1LiquidityInfo
          token={token}
          liquidityTokenAmount={liquidityTokenAmount}
          tokenWorth={tokenWorth}
          ethWorth={ethWorth}
        />

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
              {isSuccessfullyMigrated ? 'Success' : isMigrationPending ? <Dots>Migrating</Dots> : 'Migrate'}
            </ButtonConfirmed>
          </AutoColumn>
        </div>
      </LightCard>
      <TYPE.darkGray style={{ textAlign: 'center' }}>
        {`Your Uniswap V1 ${token.symbol}/ETH liquidity will become Uniswap V2 ${token.symbol}/ETH liquidity.`}
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
  const validatedAddress = isAddress(address)
  const { chainId, account } = useActiveWeb3React()

  const exchangeContract = useV1ExchangeContract(validatedAddress ? validatedAddress : undefined)
  const tokenAddress = useSingleCallResult(exchangeContract, 'tokenAddress', undefined, NEVER_RELOAD)?.result?.[0]

  const token = useToken(tokenAddress)

  const liquidityToken: Token | undefined = useMemo(
    () =>
      validatedAddress && token
        ? new Token(chainId, validatedAddress, 18, `UNI-V1-${token.symbol}`, 'Uniswap V1')
        : undefined,
    [chainId, validatedAddress, token]
  )
  const userLiquidityBalance = useTokenBalance(account, liquidityToken)

  const handleBack = useCallback(() => {
    history.push('/migrate/v1')
  }, [history])

  // redirect for invalid url params
  if (!validatedAddress || tokenAddress === AddressZero) {
    console.error('Invalid address in path', address)
    return <Redirect to="/migrate/v1" />
  }

  return (
    <BodyWrapper style={{ padding: 24 }}>
      <AutoColumn gap="16px">
        <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
          <div style={{ cursor: 'pointer' }}>
            <ArrowLeft onClick={handleBack} />
          </div>
          <TYPE.mediumHeader>Migrate V1 Liquidity</TYPE.mediumHeader>
          <div>
            <QuestionHelper text="Migrate your liquidity tokens from Uniswap V1 to Uniswap V2." />
          </div>
        </AutoRow>

        {!account ? (
          <TYPE.largeHeader>You must connect an account.</TYPE.largeHeader>
        ) : validatedAddress && token?.equals(WETH[chainId]) ? (
          <>
            <TYPE.body my={9} style={{ fontWeight: 400 }}>
              Because Uniswap V2 uses WETH under the hood, your Uniswap V1 WETH/ETH liquidity cannot be migrated. You
              may want to remove your liquidity instead.
            </TYPE.body>

            <ButtonConfirmed
              onClick={() => {
                history.push(`/remove/v1/${validatedAddress}`)
              }}
            >
              Remove
            </ButtonConfirmed>
          </>
        ) : userLiquidityBalance && token ? (
          <V1PairMigration liquidityTokenAmount={userLiquidityBalance} token={token} />
        ) : (
          <EmptyState message="Loading..." />
        )}
      </AutoColumn>
    </BodyWrapper>
  )
}
