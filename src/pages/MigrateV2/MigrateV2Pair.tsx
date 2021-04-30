import React, { useCallback, useMemo, useState } from 'react'
import { Fraction, Price, Token, TokenAmount, WETH9 } from '@uniswap/sdk-core'
import { JSBI } from '@uniswap/v2-sdk'
import { Redirect, RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import { AutoColumn } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import FormattedCurrencyAmount from '../../components/FormattedCurrencyAmount'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { useV2LiquidityTokenPermit } from '../../hooks/useERC20Permit'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { usePairContract, useV2MigratorContract } from '../../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { BackArrow, ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, isAddress } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { V3_MIGRATOR_ADDRESSES } from 'constants/v3'
import { PoolState, usePool } from 'hooks/usePools'
import { FeeAmount, Pool, Position, priceToClosestTick, TickMath } from '@uniswap/v3-sdk'
import { LightCard, PinkCard, YellowCard } from 'components/Card'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { Dots } from 'components/swap/styleds'
import { ButtonConfirmed } from 'components/Button'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useUserSlippageTolerance } from 'state/user/hooks'
import ReactGA from 'react-ga'
import { TransactionResponse } from '@ethersproject/providers'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { useDerivedMintInfo, useMintActionHandlers, useRangeHopCallbacks } from 'state/mint/hooks'
import { Bound } from 'state/mint/actions'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ChevronDown } from 'react-feather'
import FeeSelector from 'components/FeeSelector'
import RangeSelector from 'components/RangeSelector'
import RateToggle from 'components/RateToggle'
import { Contract } from '@ethersproject/contracts'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { formatTokenAmount } from 'utils/formatTokenAmount'
import useTheme from 'hooks/useTheme'
import { unwrappedToken } from 'utils/wrappedCurrency'

const ZERO = JSBI.BigInt(0)

function EmptyState({ message }: { message: string }) {
  return (
    <AutoColumn style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
      <TYPE.body>{message}</TYPE.body>
    </AutoColumn>
  )
}

function LiquidityInfo({ token0Amount, token1Amount }: { token0Amount: TokenAmount; token1Amount: TokenAmount }) {
  const currency0 = unwrappedToken(token0Amount.token)
  const currency1 = unwrappedToken(token1Amount.token)

  return (
    <>
      <RowBetween my="1rem">
        <Text fontSize={16} fontWeight={500}>
          Pooled {currency0.symbol}:
        </Text>
        <RowFixed>
          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
            <FormattedCurrencyAmount currencyAmount={token0Amount} />
          </Text>
          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
        </RowFixed>
      </RowBetween>
      <RowBetween mb="1rem">
        <Text fontSize={16} fontWeight={500}>
          Pooled {currency1.symbol}:
        </Text>
        <RowFixed>
          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
            <FormattedCurrencyAmount currencyAmount={token1Amount} />
          </Text>
          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
        </RowFixed>
      </RowBetween>
    </>
  )
}

// hard-code this for now
const percentageToMigrate = 100

function V2PairMigration({
  pair,
  pairBalance,
  totalSupply,
  reserve0,
  reserve1,
  token0,
  token1,
}: {
  pair: Contract
  pairBalance: TokenAmount
  totalSupply: TokenAmount
  reserve0: TokenAmount
  reserve1: TokenAmount
  token0: Token
  token1: Token
}) {
  const { t } = useTranslation()
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()

  const deadline = useTransactionDeadline() // custom from users settings
  const blockTimestamp = useCurrentBlockTimestamp()
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users

  const currency0 = unwrappedToken(token0)
  const currency1 = unwrappedToken(token1)

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

  const largePriceDifference = priceDifferenceFraction && !priceDifferenceFraction?.lessThan(JSBI.BigInt(2))

  // the following is a small hack to get access to price range data/input handlers
  const [baseToken, setBaseToken] = useState(token0)
  const { ticks, pricesAtTicks, invertPrice, invalidRange, outOfRange } = useDerivedMintInfo(
    token0,
    token1,
    feeAmount,
    baseToken
  )

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    baseToken,
    baseToken.equals(token0) ? token1 : token0,
    feeAmount,
    tickLower,
    tickUpper
  )

  const { onLeftRangeInput, onRightRangeInput } = useMintActionHandlers(noLiquidity)

  // the v3 tick is either the pool's tickCurrent, or the tick closest to the v2 spot price
  const tick = pool?.tickCurrent ?? priceToClosestTick(v2SpotPrice)
  // the price is either the current v3 price, or the price at the tick
  const sqrtPrice = pool?.sqrtRatioX96 ?? TickMath.getSqrtRatioAtTick(tick)
  const position =
    typeof tickLower === 'number' && typeof tickUpper === 'number' && !invalidRange
      ? Position.fromAmounts({
          pool: pool ?? new Pool(token0, token1, feeAmount, sqrtPrice, 0, tick, []),
          tickLower,
          tickUpper,
          amount0: token0Value.raw,
          amount1: token1Value.raw,
        })
      : undefined

  const v3Amount0Min = useMemo(
    () =>
      position &&
      new TokenAmount(
        token0,
        JSBI.divide(JSBI.multiply(position.amount0.raw, JSBI.BigInt(10000 - allowedSlippage)), JSBI.BigInt(10000))
      ),
    [token0, position, allowedSlippage]
  )
  const v3Amount1Min = useMemo(
    () =>
      position &&
      new TokenAmount(
        token1,
        JSBI.divide(JSBI.multiply(position.amount1.raw, JSBI.BigInt(10000 - allowedSlippage)), JSBI.BigInt(10000))
      ),
    [token1, position, allowedSlippage]
  )

  const refund0 = useMemo(
    () => v3Amount0Min && new TokenAmount(token0, JSBI.subtract(token0Value.raw, v3Amount0Min.raw)),
    [token0Value, v3Amount0Min, token0]
  )
  const refund1 = useMemo(
    () => v3Amount1Min && new TokenAmount(token1, JSBI.subtract(token1Value.raw, v3Amount1Min.raw)),
    [token1Value, v3Amount1Min, token1]
  )

  const [confirmingMigration, setConfirmingMigration] = useState<boolean>(false)
  const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)

  const migrator = useV2MigratorContract()

  // approvals
  const migratorAddress = chainId && V3_MIGRATOR_ADDRESSES[chainId]
  const [approval, approveManually] = useApproveCallback(pairBalance, migratorAddress)
  const { signatureData, gatherPermitSignature } = useV2LiquidityTokenPermit(pairBalance, migratorAddress)

  const approve = useCallback(async () => {
    gatherPermitSignature ? gatherPermitSignature() : approveManually ? approveManually() : null
  }, [gatherPermitSignature, approveManually])

  const addTransaction = useTransactionAdder()
  const isMigrationPending = useIsTransactionPending(pendingMigrationHash ?? undefined)

  const migrate = useCallback(() => {
    if (
      !migrator ||
      !account ||
      !deadline ||
      !blockTimestamp ||
      typeof tickLower !== 'number' ||
      typeof tickUpper !== 'number' ||
      !v3Amount0Min ||
      !v3Amount1Min
    )
      return

    const deadlineToUse = signatureData?.deadline ?? deadline

    const data = []

    // permit if necessary
    if (signatureData) {
      data.push(
        migrator.interface.encodeFunctionData('selfPermit', [
          pair.address,
          `0x${pairBalance.raw.toString(16)}`,
          deadlineToUse,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ])
      )
    }

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

    // TODO could save gas by not doing this in multicall
    data.push(
      migrator.interface.encodeFunctionData('migrate', [
        {
          pair: pair.address,
          liquidityToMigrate: `0x${pairBalance.raw.toString(16)}`,
          percentageToMigrate,
          token0: token0.address,
          token1: token1.address,
          fee: feeAmount,
          tickLower,
          tickUpper,
          amount0Min: `0x${v3Amount0Min.raw.toString(16)}`,
          amount1Min: `0x${v3Amount1Min.raw.toString(16)}`,
          recipient: account,
          deadline: deadlineToUse,
          refundAsETH: true, // hard-code this for now
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
          label: `${currency0.symbol}/${currency1.symbol}`,
        })

        addTransaction(response, {
          summary: `Migrate ${currency0.symbol}/${currency1.symbol} liquidity to V3`,
        })
        setPendingMigrationHash(response.hash)
      })
      .catch(() => {
        setConfirmingMigration(false)
      })
  }, [
    migrator,
    noLiquidity,
    blockTimestamp,
    token0,
    token1,
    feeAmount,
    pairBalance,
    tickLower,
    tickUpper,
    sqrtPrice,
    v3Amount0Min,
    v3Amount1Min,
    account,
    deadline,
    signatureData,
    addTransaction,
    pair,
    currency0,
    currency1,
  ])

  const isSuccessfullyMigrated = !!pendingMigrationHash && JSBI.equal(pairBalance.raw, ZERO)

  return (
    <AutoColumn gap="20px">
      <TYPE.body my={9} style={{ fontWeight: 400 }}>
        This tool will safely migrate your V2 liquidity to V3. The process is completely trustless thanks to the{' '}
        {chainId && migratorAddress && (
          <ExternalLink href={getEtherscanLink(chainId, migratorAddress, 'address')}>
            <TYPE.blue display="inline">Uniswap migration contract↗</TYPE.blue>
          </ExternalLink>
        )}
        .
      </TYPE.body>

      <LightCard>
        <LiquidityInfo token0Amount={token0Value} token1Amount={token1Value} />
      </LightCard>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ChevronDown size={24} />
      </div>

      {noLiquidity && (
        <PinkCard>
          <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
            You are the first liquidity provider for this Uniswap V3 pool. Your liquidity will be migrated at the
            current V2 price. Your transaction cost will include the gas to create the pool.
          </TYPE.body>

          <AutoColumn gap="8px">
            <RowBetween>
              <TYPE.body>V2 {invertPrice ? currency1.symbol : currency0.symbol} Price:</TYPE.body>
              <TYPE.black>
                {invertPrice
                  ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                  : `${v2SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
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
              <TYPE.body>V2 {invertPrice ? currency1.symbol : currency0.symbol} Price:</TYPE.body>
              <TYPE.black>
                {invertPrice
                  ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                  : `${v2SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
              </TYPE.black>
            </RowBetween>

            <RowBetween>
              <TYPE.body>V3 {invertPrice ? currency1.symbol : currency0.symbol} Price:</TYPE.body>
              <TYPE.black>
                {invertPrice
                  ? `${v3SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                  : `${v3SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
              </TYPE.black>
            </RowBetween>

            <RowBetween>
              <TYPE.body color="inherit">Price Difference:</TYPE.body>
              <TYPE.black color="inherit">{priceDifferenceFraction?.toSignificant(4)}%</TYPE.black>
            </RowBetween>
          </AutoColumn>
        </YellowCard>
      )}

      <FeeSelector feeAmount={feeAmount} handleFeePoolSelect={setFeeAmount} />

      <RowBetween>
        <TYPE.label>{t('selectLiquidityRange')}</TYPE.label>
        <RateToggle
          currencyA={invertPrice ? currency1 : currency0}
          currencyB={invertPrice ? currency0 : currency1}
          handleRateToggle={() => {
            onLeftRangeInput('')
            onRightRangeInput('')
            setBaseToken((base) => (base.equals(token0) ? token1 : token0))
          }}
        />
      </RowBetween>

      <RangeSelector
        priceLower={priceLower}
        priceUpper={priceUpper}
        getDecrementLower={getDecrementLower}
        getIncrementLower={getIncrementLower}
        getDecrementUpper={getDecrementUpper}
        getIncrementUpper={getIncrementUpper}
        onLeftRangeInput={onLeftRangeInput}
        onRightRangeInput={onRightRangeInput}
        currencyA={invertPrice ? currency1 : currency0}
        currencyB={invertPrice ? currency0 : currency1}
        feeAmount={feeAmount}
      />

      {outOfRange ? (
        <YellowCard padding="8px 12px" borderRadius="12px">
          <RowBetween>
            <AlertTriangle stroke={theme.yellow3} size="16px" />
            <TYPE.yellow ml="12px" fontSize="12px">
              {t('inactiveRangeWarning')}
            </TYPE.yellow>
          </RowBetween>
        </YellowCard>
      ) : null}

      {invalidRange ? (
        <YellowCard padding="8px 12px" borderRadius="12px">
          <RowBetween>
            <AlertTriangle stroke={theme.yellow3} size="16px" />
            <TYPE.yellow ml="12px" fontSize="12px">
              {t('invalidRangeWarning')}
            </TYPE.yellow>
          </RowBetween>
        </YellowCard>
      ) : null}

      <LightCard>
        {v3Amount0Min && v3Amount1Min ? (
          <LiquidityInfo token0Amount={v3Amount0Min} token1Amount={v3Amount1Min} />
        ) : null}

        <div style={{ display: 'flex', marginTop: '1rem' }}>
          {!isSuccessfullyMigrated && !isMigrationPending ? (
            <AutoColumn gap="12px" style={{ flex: '1', marginRight: 12 }}>
              <ButtonConfirmed
                confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                disabled={
                  approval !== ApprovalState.NOT_APPROVED ||
                  signatureData !== null ||
                  !v3Amount0Min ||
                  !v3Amount1Min ||
                  invalidRange ||
                  confirmingMigration
                }
                onClick={approve}
              >
                {approval === ApprovalState.PENDING ? (
                  <Dots>Approving</Dots>
                ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                  'Approved'
                ) : (
                  'Approve'
                )}
              </ButtonConfirmed>
            </AutoColumn>
          ) : null}
          <AutoColumn gap="12px" style={{ flex: '1' }}>
            <ButtonConfirmed
              confirmed={isSuccessfullyMigrated}
              disabled={
                !v3Amount0Min ||
                !v3Amount1Min ||
                invalidRange ||
                (approval !== ApprovalState.APPROVED && signatureData === null) ||
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

        {chainId && refund0 && refund1 ? (
          <div style={{ marginTop: '1rem' }}>
            <TYPE.darkGray style={{ textAlign: 'center' }}>
              {formatTokenAmount(refund0, 4)} {token0.equals(WETH9[chainId]) ? 'ETH' : token0.symbol} and{' '}
              {formatTokenAmount(refund1, 4)} {token1.equals(WETH9[chainId]) ? 'ETH' : token1.symbol} will be refunded
              to your wallet.
            </TYPE.darkGray>
          </div>
        ) : null}
      </LightCard>
      <TYPE.darkGray style={{ textAlign: 'center' }}>
        {`Your Uniswap V2 ${invertPrice ? currency0?.symbol : currency1?.symbol} / ${
          invertPrice ? currency1?.symbol : currency0?.symbol
        } liquidity tokens will become a Uniswap V3 ${invertPrice ? currency0?.symbol : currency1?.symbol} / ${
          invertPrice ? currency1?.symbol : currency0?.symbol
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
    !pair ||
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
            pair={pair}
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
