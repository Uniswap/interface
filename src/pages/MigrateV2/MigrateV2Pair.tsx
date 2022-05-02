import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Fraction, Percent, Price, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Position, priceToClosestTick, TickMath } from '@uniswap/v3-sdk'
import Badge, { BadgeVariant } from 'components/Badge'
import { ButtonConfirmed } from 'components/Button'
import { BlueCard, DarkGreyCard, LightCard, YellowCard } from 'components/Card'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import FeeSelector from 'components/FeeSelector'
import RangeSelector from 'components/RangeSelector'
import RateToggle from 'components/RateToggle'
import SettingsTab from 'components/Settings'
import { Dots } from 'components/swap/styleds'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { PoolState, usePool } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useV2LiquidityTokenPermit } from 'hooks/useV2LiquidityTokenPermit'
import JSBI from 'jsbi'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowDown } from 'react-feather'
import ReactGA from 'react-ga4'
import { Redirect, RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import { Bound, resetMintState } from 'state/mint/v3/actions'
import { useRangeHopCallbacks, useV3DerivedMintInfo, useV3MintActionHandlers } from 'state/mint/v3/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { unwrappedToken } from 'utils/unwrappedToken'

import { AutoColumn } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import FormattedCurrencyAmount from '../../components/FormattedCurrencyAmount'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useToken } from '../../hooks/Tokens'
import { usePairContract, useV2MigratorContract } from '../../hooks/useContract'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import { TransactionType } from '../../state/transactions/types'
import { useTokenBalance } from '../../state/wallet/hooks'
import { BackArrow, ExternalLink, ThemedText } from '../../theme'
import { isAddress } from '../../utils'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { currencyId } from '../../utils/currencyId'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { BodyWrapper } from '../AppBody'

const ZERO = JSBI.BigInt(0)

const DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE = new Percent(75, 10_000)

function EmptyState({ message }: { message: ReactNode }) {
  return (
    <AutoColumn style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText.Body>{message}</ThemedText.Body>
    </AutoColumn>
  )
}

function LiquidityInfo({
  token0Amount,
  token1Amount,
}: {
  token0Amount: CurrencyAmount<Token>
  token1Amount: CurrencyAmount<Token>
}) {
  const currency0 = unwrappedToken(token0Amount.currency)
  const currency1 = unwrappedToken(token1Amount.currency)

  return (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <CurrencyLogo size="20px" style={{ marginRight: '8px' }} currency={currency0} />
          <Text fontSize={16} fontWeight={500}>
            {currency0.symbol}
          </Text>
        </RowFixed>
        <Text fontSize={16} fontWeight={500}>
          <FormattedCurrencyAmount currencyAmount={token0Amount} />
        </Text>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <CurrencyLogo size="20px" style={{ marginRight: '8px' }} currency={currency1} />
          <Text fontSize={16} fontWeight={500}>
            {currency1.symbol}
          </Text>
        </RowFixed>

        <Text fontSize={16} fontWeight={500}>
          <FormattedCurrencyAmount currencyAmount={token1Amount} />
        </Text>
      </RowBetween>
    </AutoColumn>
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
  pairBalance: CurrencyAmount<Token>
  totalSupply: CurrencyAmount<Token>
  reserve0: CurrencyAmount<Token>
  reserve1: CurrencyAmount<Token>
  token0: Token
  token1: Token
}) {
  const { chainId, account } = useActiveWeb3React()
  const theme = useTheme()
  const v2FactoryAddress = chainId ? V2_FACTORY_ADDRESSES[chainId] : undefined

  const pairFactory = useSingleCallResult(pair, 'factory')
  const isNotUniswap = pairFactory.result?.[0] && pairFactory.result[0] !== v2FactoryAddress

  const deadline = useTransactionDeadline() // custom from users settings
  const blockTimestamp = useCurrentBlockTimestamp()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE) // custom from users

  const currency0 = unwrappedToken(token0)
  const currency1 = unwrappedToken(token1)

  // this is just getLiquidityValue with the fee off, but for the passed pair
  const token0Value = useMemo(
    () =>
      CurrencyAmount.fromRawAmount(
        token0,
        JSBI.divide(JSBI.multiply(pairBalance.quotient, reserve0.quotient), totalSupply.quotient)
      ),
    [token0, pairBalance, reserve0, totalSupply]
  )
  const token1Value = useMemo(
    () =>
      CurrencyAmount.fromRawAmount(
        token1,
        JSBI.divide(JSBI.multiply(pairBalance.quotient, reserve1.quotient), totalSupply.quotient)
      ),
    [token1, pairBalance, reserve1, totalSupply]
  )

  // set up v3 pool
  const [feeAmount, setFeeAmount] = useState(FeeAmount.MEDIUM)
  const [poolState, pool] = usePool(token0, token1, feeAmount)
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  // get spot prices + price difference
  const v2SpotPrice = useMemo(
    () => new Price(token0, token1, reserve0.quotient, reserve1.quotient),
    [token0, token1, reserve0, reserve1]
  )
  const v3SpotPrice = poolState === PoolState.EXISTS ? pool?.token0Price : undefined

  let priceDifferenceFraction: Fraction | undefined =
    v2SpotPrice && v3SpotPrice ? v3SpotPrice.divide(v2SpotPrice).subtract(1).multiply(100) : undefined
  if (priceDifferenceFraction?.lessThan(ZERO)) {
    priceDifferenceFraction = priceDifferenceFraction.multiply(-1)
  }

  const largePriceDifference = priceDifferenceFraction && !priceDifferenceFraction?.lessThan(JSBI.BigInt(2))

  // the following is a small hack to get access to price range data/input handlers
  const [baseToken, setBaseToken] = useState(token0)
  const { ticks, pricesAtTicks, invertPrice, invalidRange, outOfRange, ticksAtLimit } = useV3DerivedMintInfo(
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

  const { onLeftRangeInput, onRightRangeInput } = useV3MintActionHandlers(noLiquidity)

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
          amount0: token0Value.quotient,
          amount1: token1Value.quotient,
          useFullPrecision: true, // we want full precision for the theoretical position
        })
      : undefined

  const { amount0: v3Amount0Min, amount1: v3Amount1Min } = useMemo(
    () => (position ? position.mintAmountsWithSlippage(allowedSlippage) : { amount0: undefined, amount1: undefined }),
    [position, allowedSlippage]
  )

  const refund0 = useMemo(
    () =>
      position && CurrencyAmount.fromRawAmount(token0, JSBI.subtract(token0Value.quotient, position.amount0.quotient)),
    [token0Value, position, token0]
  )
  const refund1 = useMemo(
    () =>
      position && CurrencyAmount.fromRawAmount(token1, JSBI.subtract(token1Value.quotient, position.amount1.quotient)),
    [token1Value, position, token1]
  )

  const [confirmingMigration, setConfirmingMigration] = useState<boolean>(false)
  const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)

  const migrator = useV2MigratorContract()

  // approvals
  const [approval, approveManually] = useApproveCallback(pairBalance, migrator?.address)
  const { signatureData, gatherPermitSignature } = useV2LiquidityTokenPermit(pairBalance, migrator?.address)

  const isArgentWallet = useIsArgentWallet()

  const approve = useCallback(async () => {
    if (isNotUniswap || isArgentWallet) {
      // sushi has to be manually approved
      await approveManually()
    } else if (gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveManually()
        }
      }
    } else {
      await approveManually()
    }
  }, [isNotUniswap, isArgentWallet, gatherPermitSignature, approveManually])

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
      !v3Amount1Min ||
      !chainId
    )
      return

    const deadlineToUse = signatureData?.deadline ?? deadline

    const data: string[] = []

    // permit if necessary
    if (signatureData) {
      data.push(
        migrator.interface.encodeFunctionData('selfPermit', [
          pair.address,
          `0x${pairBalance.quotient.toString(16)}`,
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
          liquidityToMigrate: `0x${pairBalance.quotient.toString(16)}`,
          percentageToMigrate,
          token0: token0.address,
          token1: token1.address,
          fee: feeAmount,
          tickLower,
          tickUpper,
          amount0Min: `0x${v3Amount0Min.toString(16)}`,
          amount1Min: `0x${v3Amount1Min.toString(16)}`,
          recipient: account,
          deadline: deadlineToUse,
          refundAsETH: true, // hard-code this for now
        },
      ])
    )

    setConfirmingMigration(true)

    migrator.estimateGas
      .multicall(data)
      .then((gasEstimate) => {
        return migrator
          .multicall(data, { gasLimit: calculateGasMargin(gasEstimate) })
          .then((response: TransactionResponse) => {
            ReactGA.event({
              category: 'Migrate',
              action: `${isNotUniswap ? 'SushiSwap' : 'V2'}->V3`,
              label: `${currency0.symbol}/${currency1.symbol}`,
            })

            addTransaction(response, {
              type: TransactionType.MIGRATE_LIQUIDITY_V3,
              baseCurrencyId: currencyId(currency0),
              quoteCurrencyId: currencyId(currency1),
              isFork: isNotUniswap,
            })
            setPendingMigrationHash(response.hash)
          })
      })
      .catch(() => {
        setConfirmingMigration(false)
      })
  }, [
    chainId,
    isNotUniswap,
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

  const isSuccessfullyMigrated = !!pendingMigrationHash && JSBI.equal(pairBalance.quotient, ZERO)

  return (
    <AutoColumn gap="20px">
      <ThemedText.Body my={9} style={{ fontWeight: 400 }}>
        <Trans>
          This tool will safely migrate your {isNotUniswap ? 'SushiSwap' : 'V2'} liquidity to V3. The process is
          completely trustless thanks to the{' '}
        </Trans>
        {chainId && migrator && (
          <ExternalLink href={getExplorerLink(chainId, migrator.address, ExplorerDataType.ADDRESS)}>
            <ThemedText.Blue display="inline">
              <Trans>Uniswap migration contract↗</Trans>
            </ThemedText.Blue>
          </ExternalLink>
        )}
        .
      </ThemedText.Body>

      <LightCard>
        <AutoColumn gap="lg">
          <RowBetween>
            <RowFixed style={{ marginLeft: '8px' }}>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={false} size={20} />
              <ThemedText.MediumHeader style={{ marginLeft: '8px' }}>
                <Trans>
                  {currency0.symbol}/{currency1.symbol} LP Tokens
                </Trans>
              </ThemedText.MediumHeader>
            </RowFixed>
            <Badge variant={BadgeVariant.WARNING}>{isNotUniswap ? 'Sushi' : 'V2'}</Badge>
          </RowBetween>
          <LiquidityInfo token0Amount={token0Value} token1Amount={token1Value} />
        </AutoColumn>
      </LightCard>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ArrowDown size={24} />
      </div>

      <LightCard>
        <AutoColumn gap="lg">
          <RowBetween>
            <RowFixed style={{ marginLeft: '8px' }}>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={false} size={20} />
              <ThemedText.MediumHeader style={{ marginLeft: '8px' }}>
                <Trans>
                  {currency0.symbol}/{currency1.symbol} LP NFT
                </Trans>
              </ThemedText.MediumHeader>
            </RowFixed>
            <Badge variant={BadgeVariant.PRIMARY}>V3</Badge>
          </RowBetween>

          <FeeSelector feeAmount={feeAmount} handleFeePoolSelect={setFeeAmount} />
          {noLiquidity && (
            <BlueCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AlertCircle color={theme.text1} style={{ marginBottom: '12px', opacity: 0.8 }} />
              <ThemedText.Body
                fontSize={14}
                style={{ marginBottom: 8, fontWeight: 500, opacity: 0.8 }}
                textAlign="center"
              >
                <Trans>
                  You are the first liquidity provider for this Uniswap V3 pool. Your liquidity will migrate at the
                  current {isNotUniswap ? 'SushiSwap' : 'V2'} price.
                </Trans>
              </ThemedText.Body>

              <ThemedText.Body
                fontWeight={500}
                textAlign="center"
                fontSize={14}
                style={{ marginTop: '8px', opacity: 0.8 }}
              >
                <Trans>Your transaction cost will be much higher as it includes the gas to create the pool.</Trans>
              </ThemedText.Body>

              {v2SpotPrice && (
                <AutoColumn gap="8px" style={{ marginTop: '12px' }}>
                  <RowBetween>
                    <ThemedText.Body fontWeight={500} fontSize={14}>
                      <Trans>
                        {isNotUniswap ? 'SushiSwap' : 'V2'} {invertPrice ? currency1.symbol : currency0.symbol} Price:
                      </Trans>{' '}
                      {invertPrice
                        ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                        : `${v2SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                    </ThemedText.Body>
                  </RowBetween>
                </AutoColumn>
              )}
            </BlueCard>
          )}

          {largePriceDifference ? (
            <YellowCard>
              <AutoColumn gap="8px">
                <RowBetween>
                  <ThemedText.Body fontSize={14}>
                    <Trans>
                      {isNotUniswap ? 'SushiSwap' : 'V2'} {invertPrice ? currency1.symbol : currency0.symbol} Price:
                    </Trans>
                  </ThemedText.Body>
                  <ThemedText.Black fontSize={14}>
                    {invertPrice
                      ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                      : `${v2SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                  </ThemedText.Black>
                </RowBetween>

                <RowBetween>
                  <ThemedText.Body fontSize={14}>
                    <Trans>V3 {invertPrice ? currency1.symbol : currency0.symbol} Price:</Trans>
                  </ThemedText.Body>
                  <ThemedText.Black fontSize={14}>
                    {invertPrice
                      ? `${v3SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                      : `${v3SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                  </ThemedText.Black>
                </RowBetween>

                <RowBetween>
                  <ThemedText.Body fontSize={14} color="inherit">
                    <Trans>Price Difference:</Trans>
                  </ThemedText.Body>
                  <ThemedText.Black fontSize={14} color="inherit">
                    <Trans>{priceDifferenceFraction?.toSignificant(4)}%</Trans>
                  </ThemedText.Black>
                </RowBetween>
              </AutoColumn>
              <ThemedText.Body fontSize={14} style={{ marginTop: 8, fontWeight: 400 }}>
                <Trans>
                  You should only deposit liquidity into Uniswap V3 at a price you believe is correct. <br />
                  If the price seems incorrect, you can either make a swap to move the price or wait for someone else to
                  do so.
                </Trans>
              </ThemedText.Body>
            </YellowCard>
          ) : !noLiquidity && v3SpotPrice ? (
            <RowBetween>
              <ThemedText.Body fontSize={14}>
                <Trans>V3 {invertPrice ? currency1.symbol : currency0.symbol} Price:</Trans>
              </ThemedText.Body>
              <ThemedText.Black fontSize={14}>
                {invertPrice
                  ? `${v3SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                  : `${v3SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
              </ThemedText.Black>
            </RowBetween>
          ) : null}

          <RowBetween>
            <ThemedText.Label>
              <Trans>Set Price Range</Trans>
            </ThemedText.Label>
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
            ticksAtLimit={ticksAtLimit}
          />

          {outOfRange ? (
            <YellowCard padding="8px 12px" $borderRadius="12px">
              <RowBetween>
                <AlertTriangle stroke={theme.yellow3} size="16px" />
                <ThemedText.Yellow ml="12px" fontSize="12px">
                  <Trans>
                    Your position will not earn fees or be used in trades until the market price moves into your range.
                  </Trans>
                </ThemedText.Yellow>
              </RowBetween>
            </YellowCard>
          ) : null}

          {invalidRange ? (
            <YellowCard padding="8px 12px" $borderRadius="12px">
              <RowBetween>
                <AlertTriangle stroke={theme.yellow3} size="16px" />
                <ThemedText.Yellow ml="12px" fontSize="12px">
                  <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                </ThemedText.Yellow>
              </RowBetween>
            </YellowCard>
          ) : null}

          {position ? (
            <DarkGreyCard>
              <AutoColumn gap="md">
                <LiquidityInfo token0Amount={position.amount0} token1Amount={position.amount1} />
                {chainId && refund0 && refund1 ? (
                  <ThemedText.Black fontSize={12}>
                    <Trans>
                      At least {formatCurrencyAmount(refund0, 4)}{' '}
                      {chainId && WRAPPED_NATIVE_CURRENCY[chainId]?.equals(token0) ? 'ETH' : token0.symbol} and{' '}
                      {formatCurrencyAmount(refund1, 4)}{' '}
                      {chainId && WRAPPED_NATIVE_CURRENCY[chainId]?.equals(token1) ? 'ETH' : token1.symbol} will be
                      refunded to your wallet due to selected price range.
                    </Trans>
                  </ThemedText.Black>
                ) : null}
              </AutoColumn>
            </DarkGreyCard>
          ) : null}

          <AutoColumn gap="12px">
            {!isSuccessfullyMigrated && !isMigrationPending ? (
              <AutoColumn gap="12px" style={{ flex: '1' }}>
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
                    <Dots>
                      <Trans>Approving</Trans>
                    </Dots>
                  ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                    <Trans>Allowed</Trans>
                  ) : (
                    <Trans>Allow LP token migration</Trans>
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
                {isSuccessfullyMigrated ? (
                  'Success!'
                ) : isMigrationPending ? (
                  <Dots>
                    <Trans>Migrating</Trans>
                  </Dots>
                ) : (
                  <Trans>Migrate</Trans>
                )}
              </ButtonConfirmed>
            </AutoColumn>
          </AutoColumn>
        </AutoColumn>
      </LightCard>
    </AutoColumn>
  )
}

export default function MigrateV2Pair({
  match: {
    params: { address },
  },
}: RouteComponentProps<{ address: string }>) {
  // reset mint state on component mount, and as a cleanup (on unmount)
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(resetMintState())
    return () => {
      dispatch(resetMintState())
    }
  }, [dispatch])

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
    () => (chainId && validatedAddress ? new Token(chainId, validatedAddress, 18) : undefined),
    [chainId, validatedAddress]
  )

  // get data required for V2 pair migration
  const pairBalance = useTokenBalance(account ?? undefined, liquidityToken)
  const totalSupply = useTotalSupply(liquidityToken)
  const [reserve0Raw, reserve1Raw] = useSingleCallResult(pair, 'getReserves')?.result ?? []
  const reserve0 = useMemo(
    () => (token0 && reserve0Raw ? CurrencyAmount.fromRawAmount(token0, reserve0Raw) : undefined),
    [token0, reserve0Raw]
  )
  const reserve1 = useMemo(
    () => (token1 && reserve1Raw ? CurrencyAmount.fromRawAmount(token1, reserve1Raw) : undefined),
    [token1, reserve1Raw]
  )

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
          <ThemedText.MediumHeader>
            <Trans>Migrate V2 Liquidity</Trans>
          </ThemedText.MediumHeader>
          <SettingsTab placeholderSlippage={DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE} />
        </AutoRow>

        {!account ? (
          <ThemedText.LargeHeader>
            <Trans>You must connect an account.</Trans>
          </ThemedText.LargeHeader>
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
          <EmptyState message={<Trans>Loading</Trans>} />
        )}
      </AutoColumn>
    </BodyWrapper>
  )
}
