import type { TransactionResponse } from '@ethersproject/providers'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { type Currency, CurrencyAmount, Fraction, Percent, Price, Token, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Position, priceToClosestTick, TickMath } from '@uniswap/v3-sdk'
import { BlueCard, DarkGrayCard, LightCard, YellowCard } from 'components/Card/cards'
import FeeSelector from 'components/FeeSelector'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import RangeSelector from 'components/RangeSelector'
import RateToggle from 'components/RateToggle'
import { Dots } from 'components/swap/styled'
import { V2Unsupported } from 'components/V2Unsupported'
import { useToken } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePairContract, useV2MigratorContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { PoolState, usePool } from 'hooks/usePools'
import { usePositionOwnerV2 } from 'hooks/usePositionOwnerV2'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { useV2LiquidityTokenPermit } from 'hooks/useV2LiquidityTokenPermit'
import JSBI from 'jsbi'
import { BodyWrapper } from 'pages/App/AppBody'
import MigrateV2SettingsTab from 'pages/MigrateV2/Settings'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { useTokenBalance } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { Bound, resetMintState } from 'state/mint/v3/actions'
import { useRangeHopCallbacks, useV3DerivedMintInfo, useV3MintActionHandlers } from 'state/mint/v3/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { ExternalLink } from 'theme/components/Links'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import Badge from 'uniswap/src/components/badge/Badge'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InterfacePageName, LiquidityEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { LiquiditySource } from 'uniswap/src/features/telemetry/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { HexString } from 'utilities/src/addresses/hex'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { unwrappedToken } from 'utils/unwrappedToken'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract, useReadContracts } from 'wagmi'

const ZERO = JSBI.BigInt(0)

const DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE = new Percent(75, 10_000)

const MIGRATE_V2_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'token1',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: 'reserve0',
        type: 'uint112',
      },
      {
        internalType: 'uint112',
        name: 'reserve1',
        type: 'uint112',
      },
      {
        internalType: 'uint32',
        name: 'blockTimestampLast',
        type: 'uint32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const

function EmptyState({ message }: { message: ReactNode }) {
  return (
    <Flex alignItems="center" justifyContent="center" minHeight={200}>
      <Text variant="body2">{message}</Text>
    </Flex>
  )
}

const TokenPairHeader = ({
  children,
  currency0,
  currency1,
  badgeText,
}: {
  children: React.ReactNode
  currency0: Currency
  currency1: Currency
  badgeText: string
}) => {
  return (
    <Flex row justifyContent="space-between">
      <Flex row alignItems="center">
        <DoubleCurrencyLogo currencies={[currency0, currency1]} size={iconSizes.icon20} />
        <Text variant="subheading1" ml="$spacing8">
          {children}
        </Text>
      </Flex>
      <Badge placement="only">{badgeText}</Badge>
    </Flex>
  )
}

function LiquidityInfo({
  token0Amount,
  token1Amount,
}: {
  token0Amount: CurrencyAmount<Token>
  token1Amount: CurrencyAmount<Token>
}) {
  const currencyPairs = [
    {
      currency: unwrappedToken(token0Amount.currency),
      amount: token0Amount,
    },
    {
      currency: unwrappedToken(token1Amount.currency),
      amount: token1Amount,
    },
  ]

  return (
    <Flex gap="$gap8">
      {currencyPairs.map(({ currency, amount }) => (
        <Flex key={currency.symbol} row justifyContent="space-between">
          <Flex row>
            <CurrencyLogo size={iconSizes.icon20} currency={currency} />
            <Text variant="body3" ml="$spacing8">
              {currency.symbol}
            </Text>
          </Flex>
          <Text variant="body3">
            <FormattedCurrencyAmount currencyAmount={amount} />
          </Text>
        </Flex>
      ))}
    </Flex>
  )
}

// hard-code this for now
const percentageToMigrate = 100

function V2PairMigration({
  pairAddress,
  pairBalance,
  totalSupply,
  reserve0,
  reserve1,
  token0,
  token1,
}: {
  pairAddress: string
  pairBalance: CurrencyAmount<Token>
  totalSupply: CurrencyAmount<Token>
  reserve0: CurrencyAmount<Token>
  reserve1: CurrencyAmount<Token>
  token0: Token
  token1: Token
}) {
  const { t } = useTranslation()
  const account = useAccount()
  const colors = useSporeColors()
  const v2FactoryAddress = account.chainId ? V2_FACTORY_ADDRESSES[account.chainId] : undefined
  const trace = useTrace()
  const { formatCurrencyAmount } = useLocalizationContext()

  const { data: pairFactory } = useReadContract({
    address: assume0xAddress(pairAddress),
    functionName: 'factory',
    abi: MIGRATE_V2_ABI,
  })

  const isNotUniswap = !!pairFactory && pairFactory !== v2FactoryAddress

  const getDeadline = useGetTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE) // custom from users

  const currency0 = unwrappedToken(token0)
  const currency1 = unwrappedToken(token1)

  // this is just getLiquidityValue with the fee off, but for the passed pair
  const token0Value = useMemo(
    () =>
      CurrencyAmount.fromRawAmount(
        token0,
        JSBI.divide(JSBI.multiply(pairBalance.quotient, reserve0.quotient), totalSupply.quotient),
      ),
    [token0, pairBalance, reserve0, totalSupply],
  )
  const token1Value = useMemo(
    () =>
      CurrencyAmount.fromRawAmount(
        token1,
        JSBI.divide(JSBI.multiply(pairBalance.quotient, reserve1.quotient), totalSupply.quotient),
      ),
    [token1, pairBalance, reserve1, totalSupply],
  )

  // get token0 and token1 usdc values
  const token0USD = useUSDCValue(token0Value)
  const token1USD = useUSDCValue(token1Value)

  // set up v3 pool
  const [feeAmount, setFeeAmount] = useState(FeeAmount.MEDIUM)
  const [poolState, pool] = usePool({ currencyA: token0, currencyB: token1, feeAmount })
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  // get spot prices + price difference
  const v2SpotPrice = useMemo(
    () => new Price(token0, token1, reserve0.quotient, reserve1.quotient),
    [token0, token1, reserve0, reserve1],
  )
  const v3SpotPrice = poolState === PoolState.EXISTS ? pool?.token0Price : undefined

  let priceDifferenceFraction: Fraction | undefined = v3SpotPrice
    ? v3SpotPrice.divide(v2SpotPrice).subtract(1).multiply(100)
    : undefined
  if (priceDifferenceFraction?.lessThan(ZERO)) {
    priceDifferenceFraction = priceDifferenceFraction.multiply(-1)
  }

  const largePriceDifference = priceDifferenceFraction && !priceDifferenceFraction.lessThan(JSBI.BigInt(2))

  // the following is a small hack to get access to price range data/input handlers
  const [baseToken, setBaseToken] = useState(token0)
  const { ticks, pricesAtTicks, invertPrice, invalidRange, outOfRange, ticksAtLimit } = useV3DerivedMintInfo({
    currencyA: token0,
    currencyB: token1,
    feeAmount,
    baseCurrency: baseToken,
  })

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks({
    baseCurrency: baseToken,
    quoteCurrency: baseToken.equals(token0) ? token1 : token0,
    feeAmount,
    tickLower,
    tickUpper,
    pool,
  })

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
    [position, allowedSlippage],
  )

  const refund0 = useMemo(
    () =>
      position && CurrencyAmount.fromRawAmount(token0, JSBI.subtract(token0Value.quotient, position.amount0.quotient)),
    [token0Value, position, token0],
  )
  const refund1 = useMemo(
    () =>
      position && CurrencyAmount.fromRawAmount(token1, JSBI.subtract(token1Value.quotient, position.amount1.quotient)),
    [token1Value, position, token1],
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

  const networkSupportsV2 = useNetworkSupportsV2()

  const migrate = useCallback(async () => {
    if (
      !migrator ||
      !account.address ||
      typeof tickLower !== 'number' ||
      typeof tickUpper !== 'number' ||
      !v3Amount0Min ||
      !account.chainId ||
      !networkSupportsV2
    ) {
      return
    }

    const deadline = signatureData?.deadline ?? (await getDeadline())
    if (!deadline) {
      throw new Error('could not get deadline')
    }

    const data: string[] = []

    // permit if necessary
    if (signatureData) {
      data.push(
        migrator.interface.encodeFunctionData('selfPermit', [
          pairAddress,
          `0x${pairBalance.quotient.toString(16)}`,
          deadline,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]),
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
        ]),
      )
    }

    // TODO could save gas by not doing this in multicall
    data.push(
      migrator.interface.encodeFunctionData('migrate', [
        {
          pair: pairAddress,
          liquidityToMigrate: `0x${pairBalance.quotient.toString(16)}`,
          percentageToMigrate,
          token0: token0.address,
          token1: token1.address,
          fee: feeAmount,
          tickLower,
          tickUpper,
          amount0Min: `0x${v3Amount0Min.toString(16)}`,
          amount1Min: `0x${v3Amount1Min.toString(16)}`,
          recipient: account.address,
          deadline,
          refundAsETH: true, // hard-code this for now
        },
      ]),
    )

    setConfirmingMigration(true)

    migrator.estimateGas
      .multicall(data)
      .then((gasEstimate) => {
        return migrator
          .multicall(data, { gasLimit: calculateGasMargin(gasEstimate) })
          .then((response: TransactionResponse) => {
            sendAnalyticsEvent(LiquidityEventName.MigrateLiquiditySubmitted, {
              ...getLPBaseAnalyticsProperties({
                trace,
                fee: feeAmount,
                tickSpacing: undefined,
                tickLower: undefined,
                tickUpper: undefined,
                hook: undefined,
                currency0: token0,
                currency1: token1,
                poolId: pairAddress,
                version: ProtocolVersion.V2,
                currency0AmountUsd: token0USD,
                currency1AmountUsd: token1USD,
              }),
              action: `${isNotUniswap ? LiquiditySource.Sushiswap : LiquiditySource.V2}->${LiquiditySource.V3}`,
              transaction_hash: response.hash,
            })

            addTransaction(response, {
              type: TransactionType.MigrateLiquidityV2ToV3,
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
    migrator,
    account.address,
    account.chainId,
    tickLower,
    tickUpper,
    v3Amount0Min,
    v3Amount1Min,
    networkSupportsV2,
    signatureData,
    getDeadline,
    noLiquidity,
    pairAddress,
    pairBalance.quotient,
    token0,
    token1,
    feeAmount,
    sqrtPrice,
    trace,
    token0USD,
    token1USD,
    isNotUniswap,
    addTransaction,
    currency0,
    currency1,
  ])

  const isSuccessfullyMigrated = !!pendingMigrationHash && JSBI.equal(pairBalance.quotient, ZERO)

  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  return (
    <Flex gap="$gap20">
      <Text my="$spacing8" variant="body2" textAlign="center">
        <Trans
          i18nKey="migrate.v2Description"
          values={{
            source: isNotUniswap ? 'SushiSwap' : 'V2',
          }}
        >
          <ExternalLink
            key="migration-contract"
            href={getExplorerLink({
              chainId: account.chainId ?? UniverseChainId.Mainnet,
              data: migrator?.address ?? '',
              type: ExplorerDataType.ADDRESS,
            })}
          >
            <Text color="$accent1" display="inline">
              <Trans i18nKey="migrate.contract" /> ↗
            </Text>
          </ExternalLink>
        </Trans>
        .
      </Text>

      <LightCard>
        <Flex gap="$spacing16">
          <TokenPairHeader currency0={currency0} currency1={currency1} badgeText={isNotUniswap ? 'Sushi' : 'V2'}>
            <Trans
              i18nKey="migrate.lpTokens"
              values={{
                symA: currency0.symbol,
                symB: currency1.symbol,
              }}
            />
          </TokenPairHeader>
          <LiquidityInfo token0Amount={token0Value} token1Amount={token1Value} />
        </Flex>
      </LightCard>

      <Flex row centered>
        <Arrow direction="s" color="$neutral1" size={iconSizes.icon24} />
      </Flex>

      <LightCard>
        <Flex gap="$spacing16">
          <TokenPairHeader currency0={currency0} currency1={currency1} badgeText="V3">
            <Trans
              i18nKey="migrate.lpNFT"
              values={{
                symA: currency0.symbol,
                symB: currency1.symbol,
              }}
            />
          </TokenPairHeader>
          <FeeSelector
            feeAmount={feeAmount}
            handleFeePoolSelect={setFeeAmount}
            currencyA={currency0}
            currencyB={currency1}
          />
          {noLiquidity && (
            <BlueCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AlertCircle color={colors.neutral1.val} style={{ marginBottom: '12px', opacity: 0.8 }} />
              <Text variant="body3" opacity={0.8} mb="$spacing8" textAlign="center">
                <Trans
                  i18nKey="migrate.firstLP"
                  values={{
                    source: isNotUniswap ? 'SushiSwap' : 'V2',
                  }}
                />
              </Text>

              <Text variant="body3" opacity={0.8} mt="$spacing8" textAlign="center">
                <Trans i18nKey="migrate.highGasCost" />
              </Text>

              <Flex gap="$gap8" mt="$spacing12">
                <Flex row justifyContent="space-between" alignItems="center">
                  <Text variant="body2">
                    <Trans
                      i18nKey="migrate.symbolPrice"
                      values={{
                        protocolName: isNotUniswap ? 'SushiSwap' : 'V2',
                        tokenSymbol: invertPrice ? currency1.symbol : currency0.symbol,
                      }}
                    />{' '}
                    {invertPrice
                      ? `${v2SpotPrice.invert().toSignificant(6)} ${currency0.symbol}`
                      : `${v2SpotPrice.toSignificant(6)} ${currency1.symbol}`}
                  </Text>
                </Flex>
              </Flex>
            </BlueCard>
          )}

          {largePriceDifference ? (
            <YellowCard overflow="hidden">
              <Flex gap="$gap8">
                <Flex row justifyContent="space-between" alignItems="center">
                  <Text variant="body3">
                    <Trans
                      i18nKey="migrate.symbolPrice"
                      values={{
                        protocolName: isNotUniswap ? 'SushiSwap' : 'V2',
                        tokenSymbol: invertPrice ? currency1.symbol : currency0.symbol,
                      }}
                    />
                  </Text>
                  <Text variant="body3">
                    {invertPrice
                      ? `${v2SpotPrice.invert().toSignificant(6)} ${currency0.symbol}`
                      : `${v2SpotPrice.toSignificant(6)} ${currency1.symbol}`}
                  </Text>
                </Flex>

                <Flex row justifyContent="space-between" alignItems="center" overflow="hidden">
                  <Text variant="body3">
                    V3 {invertPrice ? currency1.symbol : currency0.symbol} {t('common.price')}:
                  </Text>
                  <Text variant="body3">
                    {invertPrice
                      ? `${v3SpotPrice?.invert().toSignificant(6)} ${currency0.symbol}`
                      : `${v3SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                  </Text>
                </Flex>

                <Flex
                  row
                  justifyContent="space-between"
                  alignItems="center"
                  $platform-web={{
                    color: colors.statusWarning.val,
                  }}
                >
                  <Text variant="body3" color="inherit">
                    <Trans i18nKey="migrate.priceDifference" />
                  </Text>
                  <Text variant="body3" color="inherit">
                    {priceDifferenceFraction?.toSignificant(4)}%
                  </Text>
                </Flex>
              </Flex>
              <Text variant="body3" mt="$spacing8">
                <Trans i18nKey="migrate.priceWarning" />
              </Text>
            </YellowCard>
          ) : !noLiquidity && v3SpotPrice ? (
            <Flex row justifyContent="space-between" alignItems="center">
              <Text variant="body3">
                <Trans i18nKey="migrate.v3Price" values={{ sym: invertPrice ? currency1.symbol : currency0.symbol }} />
              </Text>
              <Text variant="body3">
                {invertPrice
                  ? `${v3SpotPrice.invert().toSignificant(6)} ${currency0.symbol}`
                  : `${v3SpotPrice.toSignificant(6)} ${currency1.symbol}`}
              </Text>
            </Flex>
          ) : null}

          <Flex row justifyContent="space-between" alignItems="center">
            <Text variant="body1">
              <Trans i18nKey="migrate.setRange" />
            </Text>
            <RateToggle
              currencyA={invertPrice ? currency1 : currency0}
              currencyB={invertPrice ? currency0 : currency1}
              handleRateToggle={() => {
                onLeftRangeInput('')
                onRightRangeInput('')
                setBaseToken((base) => (base.equals(token0) ? token1 : token0))
              }}
            />
          </Flex>

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
            <YellowCard px="$spacing8" py="$spacing12">
              <Flex row justifyContent="space-between" alignItems="center">
                <AlertTriangle stroke={colors.statusWarning.val} size="24px" />
                <Text color="$yellow600" ml={12} fontSize={12}>
                  <Trans i18nKey="migrate.positionNoFees" />
                </Text>
              </Flex>
            </YellowCard>
          ) : null}

          {invalidRange ? (
            <YellowCard px="$spacing8" py="$spacing12">
              <Flex row justifyContent="space-between" alignItems="center">
                <AlertTriangle stroke={colors.statusWarning.val} size="16px" />
                <Text ml={12} fontSize={12}>
                  <Trans i18nKey="migrate.invalidRange" />
                </Text>
              </Flex>
            </YellowCard>
          ) : null}

          {position ? (
            <DarkGrayCard>
              <Flex gap="$gap8">
                <LiquidityInfo token0Amount={position.amount0} token1Amount={position.amount1} />
                {account.chainId && refund0 && refund1 ? (
                  <Text variant="body4">
                    <Trans
                      i18nKey="migrate.refund"
                      values={{
                        amtA: formatCurrencyAmount({ value: refund0, type: NumberType.TokenTx }),
                        symA: WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(token0) ? 'ETH' : token0.symbol,
                        amtB: formatCurrencyAmount({ value: refund1, type: NumberType.TokenTx }),
                        symB: WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(token1) ? 'ETH' : token1.symbol,
                      }}
                    />
                  </Text>
                ) : null}
              </Flex>
            </DarkGrayCard>
          ) : null}

          <Flex gap="$gap8">
            {!isSuccessfullyMigrated && !isMigrationPending ? (
              <Flex gap="$gap12" style={{ flex: '1' }}>
                <Button
                  isDisabled={
                    approval !== ApprovalState.NOT_APPROVED ||
                    signatureData !== null ||
                    !v3Amount0Min ||
                    invalidRange ||
                    confirmingMigration
                  }
                  onPress={approve}
                >
                  {approval === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans i18nKey="common.approving" />
                    </Dots>
                  ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                    <Trans i18nKey="migrate.allowed" />
                  ) : (
                    <Trans i18nKey="migrate.allowLpMigration" />
                  )}
                </Button>
              </Flex>
            ) : null}
            <Flex gap="$gap12" style={{ flex: '1' }}>
              <Button
                isDisabled={
                  !v3Amount0Min ||
                  invalidRange ||
                  (approval !== ApprovalState.APPROVED && signatureData === null) ||
                  confirmingMigration ||
                  isMigrationPending ||
                  isSuccessfullyMigrated
                }
                onPress={migrate}
              >
                {isSuccessfullyMigrated ? (
                  'Success!'
                ) : isMigrationPending ? (
                  <Dots>
                    <Trans i18nKey="migrate.migrating" />
                  </Dots>
                ) : (
                  <Trans i18nKey="common.migrate" />
                )}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </LightCard>
    </Flex>
  )
}

export default function MigrateV2Pair() {
  const { address } = useParams<{ address: string }>()
  // reset mint state on component mount, and as a cleanup (on unmount)
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(resetMintState())
    return () => {
      dispatch(resetMintState())
    }
  }, [dispatch])

  const account = useAccount()

  // get pair contract
  const validatedAddress = getValidAddress({
    address,
    platform: Platform.EVM,
    withEVMChecksum: true,
  }) as Nullable<HexString>
  const pair = usePairContract(validatedAddress ? validatedAddress : undefined)

  const { data: pairAddresses, isLoading: pairAddressesLoading } = useReadContracts({
    contracts: [
      { address: validatedAddress ?? undefined, functionName: 'token0', abi: MIGRATE_V2_ABI },
      { address: validatedAddress ?? undefined, functionName: 'token1', abi: MIGRATE_V2_ABI },
    ],
  })

  const token0Address = pairAddresses?.[0].result
  const token1Address = pairAddresses?.[1].result

  // get tokens
  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  // get liquidity token balance
  const liquidityToken: Token | undefined = useMemo(
    () => (account.chainId && validatedAddress ? new Token(account.chainId, validatedAddress, 18) : undefined),
    [account.chainId, validatedAddress],
  )

  // get data required for V2 pair migration
  const pairBalance = useTokenBalance(account.address, liquidityToken)
  const isOwner = usePositionOwnerV2({
    account: account.address,
    address: liquidityToken?.address,
    chainId: token0?.chainId,
  })
  const totalSupply = useTotalSupply(liquidityToken)

  const [reserve0Raw, reserve1Raw] =
    useReadContract({ address: validatedAddress || undefined, functionName: 'getReserves', abi: MIGRATE_V2_ABI })
      .data ?? []

  const reserve0 = useMemo(
    () => (token0 && reserve0Raw ? CurrencyAmount.fromRawAmount(token0, reserve0Raw.toString()) : undefined),
    [token0, reserve0Raw],
  )
  const reserve1 = useMemo(
    () => (token1 && reserve1Raw ? CurrencyAmount.fromRawAmount(token1, reserve1Raw.toString()) : undefined),
    [token1, reserve1Raw],
  )

  const MIGRATE_PAGE_URL = '/migrate/v2'

  // redirect for invalid url params
  if (!validatedAddress || !pair || (!pairAddressesLoading && !token0Address && !account.isConnecting)) {
    logger.warn('MigrateV2Pair', 'MigrateV2Pair', 'Invalid pair address', {
      token0Address,
      token1Address,
      chainId: account.chainId,
    })
    return <Navigate to={MIGRATE_PAGE_URL} replace />
  }

  return (
    <Trace
      logImpression
      page={InterfacePageName.MigrateV2Pair}
      properties={{
        pool_address: validatedAddress,
        chain_id: account.chainId,
        label: [token0?.symbol, token1?.symbol].join('/'),
        token0Address,
        token1Address,
      }}
    >
      <BodyWrapper style={{ padding: 24 }}>
        <Flex gap="$gap16">
          <Flex row alignItems="center" justifyContent="space-between" gap="$gap8">
            <TouchableArea
              p="$spacing6"
              borderRadius="$rounded8"
              tag="a"
              href={MIGRATE_PAGE_URL}
              $platform-web={{
                textDecoration: 'none',
              }}
              hoverable
              hoverStyle={{
                backgroundColor: '$backgroundHover',
              }}
            >
              <Arrow direction="w" color="$neutral1" size={iconSizes.icon24} />
            </TouchableArea>
            <Text variant="heading3" tag="h1" fontWeight="$medium">
              <Trans i18nKey="migrate.v2Title" />
            </Text>
            <MigrateV2SettingsTab autoSlippage={DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE} chainId={account.chainId} />
          </Flex>

          {!account.isConnected || !isOwner ? (
            <Text variant="heading3">
              <Trans i18nKey="migrate.connectAccount" />
            </Text>
          ) : pairBalance && totalSupply && reserve0 && reserve1 && token0 && token1 ? (
            <V2PairMigration
              pairAddress={validatedAddress}
              pairBalance={pairBalance}
              totalSupply={totalSupply}
              reserve0={reserve0}
              reserve1={reserve1}
              token0={token0}
              token1={token1}
            />
          ) : (
            <EmptyState message={<Trans i18nKey="common.loading" />} />
          )}
        </Flex>
      </BodyWrapper>
    </Trace>
  )
}
