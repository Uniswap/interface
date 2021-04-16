import React, { useCallback, useMemo, useState } from 'react'
import { Currency, CurrencyAmount, Fraction, Price, Token, TokenAmount, WETH9 } from '@uniswap/sdk-core'
import { JSBI } from '@uniswap/v2-sdk'
import { Redirect, RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import { AutoColumn } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import FormattedCurrencyAmount from '../../components/FormattedCurrencyAmount'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { usePairContract, useV2MigratorContract } from '../../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { BackArrow, ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, isAddress } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from '../MigrateV1/EmptyState'
import { V2_MIGRATOR_ADDRESSES } from 'constants/v3'
import { PoolState, usePool } from 'data/Pools'
import { FeeAmount, Pool, Position, priceToClosestTick, TickMath } from '@uniswap/v3-sdk'
import { FeeSelector, RateToggle } from 'pages/AddLiquidity'
import { LightCard, PinkCard, YellowCard } from 'components/Card'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { Dots } from 'components/swap/styleds'
import { ButtonConfirmed } from 'components/Button'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useUserSlippageTolerance } from 'state/user/hooks'
import ReactGA from 'react-ga'
import { TransactionResponse } from '@ethersproject/providers'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'

const ZERO = JSBI.BigInt(0)

export function V2LiquidityInfo({
  token,
  liquidityTokenAmount,
  tokenWorth,
  ethWorth,
}: {
  token: Token
  liquidityTokenAmount: TokenAmount
  tokenWorth: TokenAmount
  ethWorth: CurrencyAmount
}) {
  const { chainId } = useActiveWeb3React()

  return (
    <>
      <AutoRow style={{ justifyContent: 'flex-start', width: 'fit-content' }}>
        <CurrencyLogo size="24px" currency={token} />
        <div style={{ marginLeft: '.75rem' }}>
          <TYPE.mediumHeader>
            {<FormattedCurrencyAmount currencyAmount={liquidityTokenAmount} />}{' '}
            {chainId && token.equals(WETH9[chainId]) ? 'WETH' : token.symbol}/ETH
          </TYPE.mediumHeader>
        </div>
      </AutoRow>

      <RowBetween my="1rem">
        <Text fontSize={16} fontWeight={500}>
          Pooled {chainId && token.equals(WETH9[chainId]) ? 'WETH' : token.symbol}:
        </Text>
        <RowFixed>
          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
            {tokenWorth.toSignificant(4)}
          </Text>
          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={token} />
        </RowFixed>
      </RowBetween>
      <RowBetween mb="1rem">
        <Text fontSize={16} fontWeight={500}>
          Pooled ETH:
        </Text>
        <RowFixed>
          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
            <FormattedCurrencyAmount currencyAmount={ethWorth} />
          </Text>
          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={Currency.ETHER} />
        </RowFixed>
      </RowBetween>
    </>
  )
}

function V2PairMigration({
  pairBalance,
  totalSupply,
  reserve0,
  reserve1,
  token0,
  token1,
}: {
  pairBalance: TokenAmount
  totalSupply: TokenAmount
  reserve0: TokenAmount
  reserve1: TokenAmount
  token0: Token
  token1: Token
}) {
  const { chainId, account } = useActiveWeb3React()

  // this is just getLiquidityValue with the fee off, but for the passed pair
  const token0Value = useMemo(
    () => new TokenAmount(token0, JSBI.divide(JSBI.multiply(pairBalance.raw, reserve0.raw), totalSupply.raw)),
    [token0, pairBalance, reserve0, totalSupply]
  )
  const token1Value = useMemo(
    () => new TokenAmount(token1, JSBI.divide(JSBI.multiply(pairBalance.raw, reserve1.raw), totalSupply.raw)),
    [token1, pairBalance, reserve1, totalSupply]
  )

  // set up v3 pool
  const [feeAmount, setFeeAmount] = useState(FeeAmount.MEDIUM)
  const [poolState, pool] = usePool(token0, token1, feeAmount)
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  // get spot prices + price difference
  const v2SpotPrice = useMemo(() => new Price(token0, token1, reserve0.raw, reserve1.raw), [
    token0,
    token1,
    reserve0,
    reserve1,
  ])
  const v3SpotPrice = poolState === PoolState.EXISTS ? pool?.token0Price : undefined

  let priceDifferenceFraction: Fraction | undefined =
    v2SpotPrice && v3SpotPrice ? v3SpotPrice.divide(v2SpotPrice).subtract(1).multiply(100) : undefined
  if (priceDifferenceFraction?.lessThan(ZERO)) {
    priceDifferenceFraction = priceDifferenceFraction.multiply(-1)
  }

  const largePriceDifference = priceDifferenceFraction && !priceDifferenceFraction?.lessThan(JSBI.BigInt(4))

  const [invertPrice, setInvertPrice] = useState(false)

  // TODO these obviously have to not be hardcoded eventually
  const lowerTick = -60000
  const upperTick = 60000
  const percentageToMigrate = 100

  const [confirmingMigration, setConfirmingMigration] = useState<boolean>(false)
  const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)

  // TODO add permit approval
  const [approval, approve] = useApproveCallback(pairBalance, chainId ? V2_MIGRATOR_ADDRESSES[chainId] : undefined)

  const addTransaction = useTransactionAdder()
  const isMigrationPending = useIsTransactionPending(pendingMigrationHash ?? undefined)

  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users

  const migrator = useV2MigratorContract()
  const migrate = useCallback(() => {
    if (!migrator || !account || !deadline) return

    // the v3 tick is either the tickCurrent, or the tick closest to the v2 spot price
    const tick = pool?.tickCurrent ?? priceToClosestTick(v2SpotPrice)
    // the price is either the current v3 price, or the price at the tick
    const sqrtPrice = pool?.sqrtRatioX96 ?? TickMath.getSqrtRatioAtTick(tick)

    const data = []

    // create/initialize pool if necessary
    if (noLiquidity) {
      data.push(
        migrator.interface.encodeFunctionData('createAndInitializePoolIfNecessary', [
          token0.address,
          token1.address,
          feeAmount,
          `0x${sqrtPrice.toString(16)}`,
        ])
      )
    }

    const position = Position.fromAmounts({
      pool: pool ?? new Pool(token0, token1, feeAmount, sqrtPrice, 0, tick, []),
      tickLower: lowerTick,
      tickUpper: upperTick,
      amount0: token0Value.raw,
      amount1: token1Value.raw,
    })

    // TODO could save gas by not doing this in multicall
    data.push(
      migrator.interface.encodeFunctionData('migrate', [
        {
          pair: pairBalance.token.address,
          liquidityToMigrate: `0x${pairBalance.raw.toString(16)}`,
          percentageToMigrate,
          token0: token0.address,
          token1: token1.address,
          fee: feeAmount,
          tickLower: lowerTick,
          tickUpper: upperTick,
          amount0Min: `0x${JSBI.divide(
            JSBI.multiply(position.amount0.raw, JSBI.BigInt(allowedSlippage)),
            JSBI.BigInt(10000)
          ).toString(16)}`,
          amount1Min: `0x${JSBI.divide(
            JSBI.multiply(position.amount1.raw, JSBI.BigInt(allowedSlippage)),
            JSBI.BigInt(10000)
          ).toString(16)}`,
          recipient: account,
          deadline,
          refundAsETH: true, // TODO might want to change this?
        },
      ])
    )

    setConfirmingMigration(true)
    migrator
      .multicall(data)
      .then((response: TransactionResponse) => {
        ReactGA.event({
          category: 'Migrate',
          action: 'V2->V3',
          label: `${token0.symbol}/${token1.symbol}`,
        })

        addTransaction(response, {
          summary: `Migrate ${token0.symbol}/${token1.symbol} liquidity to V3`,
        })
        setPendingMigrationHash(response.hash)
      })
      .catch(() => {
        setConfirmingMigration(false)
      })
  }, [
    migrator,
    noLiquidity,
    token0,
    token1,
    feeAmount,
    v2SpotPrice,
    pairBalance,
    token0Value,
    token1Value,
    percentageToMigrate,
    lowerTick,
    allowedSlippage,
    pool,
    upperTick,
    account,
    deadline,
    addTransaction,
  ])

  const isSuccessfullyMigrated = !!pendingMigrationHash && JSBI.equal(pairBalance.raw, ZERO)

  return (
    <AutoColumn gap="20px">
      <TYPE.body my={9} style={{ fontWeight: 400 }}>
        This tool will safely migrate your V2 liquidity to V3 with minimal price risk. The process is completely
        trustless thanks to the{' '}
        {chainId && (
          <ExternalLink href={getEtherscanLink(chainId, V2_MIGRATOR_ADDRESSES[chainId], 'address')}>
            <TYPE.blue display="inline">Uniswap migration contract↗</TYPE.blue>
          </ExternalLink>
        )}
        .
      </TYPE.body>

      <FeeSelector feeAmount={feeAmount} handleFeePoolSelect={setFeeAmount} />

      <div style={{ justifySelf: 'end' }}>
        <RateToggle
          currencyA={invertPrice ? token1 : token0}
          currencyB={invertPrice ? token0 : token1}
          handleRateToggle={() => setInvertPrice((invertPrice) => !invertPrice)}
        />
      </div>

      {noLiquidity && (
        <PinkCard>
          <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
            You are the first liquidity provider for this Uniswap V3 pool. Your liquidity will be migrated at the
            current V2 price. Your transaction cost will include the gas to create the pool.
          </TYPE.body>

          <AutoColumn gap="8px">
            <RowBetween>
              <TYPE.body>V2 Price:</TYPE.body>
              <TYPE.black>
                {invertPrice
                  ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${token0.symbol} / ${token1.symbol}`
                  : `${v2SpotPrice?.toSignificant(6)} ${token1.symbol} / ${token0.symbol}`}
              </TYPE.black>
            </RowBetween>
          </AutoColumn>
        </PinkCard>
      )}

      {largePriceDifference && (
        <YellowCard>
          <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
            You should only deposit liquidity into Uniswap V3 at a price you believe is correct. If the price seems
            incorrect, you can either make a swap to move the price or wait for someone else to do so.
          </TYPE.body>
          <AutoColumn gap="8px">
            <RowBetween>
              <TYPE.body>V2 Price:</TYPE.body>
              <TYPE.black>
                {invertPrice
                  ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${token0.symbol} / ${token1.symbol}`
                  : `${v2SpotPrice?.toSignificant(6)} ${token1.symbol} / ${token0.symbol}`}
              </TYPE.black>
            </RowBetween>

            <RowBetween>
              <TYPE.body>V3 Price:</TYPE.body>
              <TYPE.black>
                {invertPrice
                  ? `${v3SpotPrice?.invert()?.toSignificant(6)} ${token0.symbol} / ${token1.symbol}`
                  : `${v3SpotPrice?.toSignificant(6)} ${token1.symbol} / ${token0.symbol}`}
              </TYPE.black>
            </RowBetween>

            <RowBetween>
              <TYPE.body color="inherit">Price Difference:</TYPE.body>
              <TYPE.black color="inherit">{priceDifferenceFraction?.toSignificant(4)}%</TYPE.black>
            </RowBetween>
          </AutoColumn>
        </YellowCard>
      )}

      <LightCard>
        {/* <V2LiquidityInfo
          token={token}
          liquidityTokenAmount={liquidityTokenAmount}
          tokenWorth={tokenWorth}
          ethWorth={ethWorth}
        /> */}

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
                approval !== ApprovalState.APPROVED ||
                confirmingMigration ||
                isMigrationPending ||
                isSuccessfullyMigrated
              }
              onClick={migrate}
            >
              {isSuccessfullyMigrated ? 'Success!' : isMigrationPending ? <Dots>Migrating</Dots> : 'Migrate'}
            </ButtonConfirmed>
          </AutoColumn>
        </div>
      </LightCard>
      <TYPE.darkGray style={{ textAlign: 'center' }}>
        {`Your Uniswap V2 ${invertPrice ? token0?.symbol : token1?.symbol} / ${
          invertPrice ? token1?.symbol : token0?.symbol
        } liquidity tokens will become a Uniswap V3 ${invertPrice ? token0?.symbol : token1?.symbol} / ${
          invertPrice ? token1?.symbol : token0?.symbol
        } NFT.`}
      </TYPE.darkGray>
    </AutoColumn>
  )
}

export default function MigrateV2Pair({
  match: {
    params: { address },
  },
}: RouteComponentProps<{ address: string }>) {
  const { chainId, account } = useActiveWeb3React()

  // get pair contract
  const validatedAddress = isAddress(address)
  const pair = usePairContract(validatedAddress ? validatedAddress : undefined)

  // get token addresses from pair contract
  const token0AddressCallState = useSingleCallResult(pair, 'token0', undefined, NEVER_RELOAD)
  const token0Address = token0AddressCallState?.result?.[0]
  const token1Address = useSingleCallResult(pair, 'token1', undefined, NEVER_RELOAD)?.result?.[0]

  // get tokens
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  // get liquidity token balance
  const liquidityToken: Token | undefined = useMemo(
    () => (chainId && validatedAddress ? new Token(chainId, validatedAddress, 18, 'UNI-V2', 'Uniswap V2') : undefined),
    [chainId, validatedAddress]
  )

  // get data required for V2 pair migration
  const pairBalance = useTokenBalance(account ?? undefined, liquidityToken)
  const totalSupply = useTotalSupply(liquidityToken)
  const [reserve0Raw, reserve1Raw] = useSingleCallResult(pair, 'getReserves')?.result ?? []
  const reserve0 = useMemo(() => (token0 && reserve0Raw ? new TokenAmount(token0, reserve0Raw) : undefined), [
    token0,
    reserve0Raw,
  ])
  const reserve1 = useMemo(() => (token1 && reserve1Raw ? new TokenAmount(token1, reserve1Raw) : undefined), [
    token1,
    reserve1Raw,
  ])

  // redirect for invalid url params
  if (
    !validatedAddress ||
    (pair &&
      token0AddressCallState?.valid &&
      !token0AddressCallState?.loading &&
      !token0AddressCallState?.error &&
      !token0Address)
  ) {
    console.error('Invalid pair address')
    return <Redirect to="/migrate/v2" />
  }

  return (
    <BodyWrapper style={{ padding: 24 }}>
      <AutoColumn gap="16px">
        <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
          <BackArrow to="/migrate/v2" />
          <TYPE.mediumHeader>Migrate V2 Liquidity</TYPE.mediumHeader>
          <div>
            <QuestionHelper text="Migrate your liquidity tokens from Uniswap V2 to Uniswap V3." />
          </div>
        </AutoRow>

        {!account ? (
          <TYPE.largeHeader>You must connect an account.</TYPE.largeHeader>
        ) : pairBalance && totalSupply && reserve0 && reserve1 && token0 && token1 ? (
          <V2PairMigration
            pairBalance={pairBalance}
            totalSupply={totalSupply}
            reserve0={reserve0}
            reserve1={reserve1}
            token0={token0}
            token1={token1}
          />
        ) : (
          <EmptyState message="Loading..." />
        )}
      </AutoColumn>
    </BodyWrapper>
  )
}
