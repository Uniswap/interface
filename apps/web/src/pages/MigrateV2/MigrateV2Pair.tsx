import type { TransactionResponse } from '@ethersproject/providers'
import { LiquidityEventName, LiquiditySource } from '@uniswap/analytics-events'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount, Fraction, Percent, Price, Token, V2_FACTORY_ADDRESSES, type Currency } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Position, TickMath, priceToClosestTick } from '@uniswap/v3-sdk'
import Badge from 'components/Badge/Badge'
import { BlueCard, DarkGrayCard, LightCard, YellowCard } from 'components/Card/cards'
import FeeSelector from 'components/FeeSelector'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import RangeSelector from 'components/RangeSelector'
import RateToggle from 'components/RateToggle'
import SettingsTab from 'components/Settings'
import { V2Unsupported } from 'components/V2Unsupported'
import { AutoColumn } from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import { Dots } from 'components/swap/styled'
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
import { useTheme } from 'lib/styled-components'
import { BodyWrapper } from 'pages/App/AppBody'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTokenBalance } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { Bound, resetMintState } from 'state/mint/v3/actions'
import { useRangeHopCallbacks, useV3DerivedMintInfo, useV3MintActionHandlers } from 'state/mint/v3/hooks'
import { useIsTransactionPending, useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { ExternalLink, ThemedText } from 'theme/components'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes } from 'ui/src/theme'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { unwrappedToken } from 'utils/unwrappedToken'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContract, useReadContracts } from 'wagmi'
import { MigrateHeader } from '.'

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
    <AutoColumn style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText.DeprecatedBody>{message}</ThemedText.DeprecatedBody>
    </AutoColumn>
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
      <Badge>{badgeText}</Badge>
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
  const theme = useTheme()
  const v2FactoryAddress = account.chainId ? V2_FACTORY_ADDRESSES[account.chainId] : undefined
  const trace = useTrace()

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
  const [poolState, pool] = usePool(token0, token1, feeAmount)
  const noLiquidity = poolState === PoolState.NOT_EXISTS

  // get spot prices + price difference
  const v2SpotPrice = useMemo(
    () => new Price(token0, token1, reserve0.quotient, reserve1.quotient),
    [token0, token1, reserve0, reserve1],
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
    baseToken,
  )

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
      !v3Amount1Min ||
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
            sendAnalyticsEvent(LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED, {
              ...getLPBaseAnalyticsProperties({
                trace,
                fee: feeAmount,
                currency0: token0,
                currency1: token1,
                poolId: pairAddress,
                version: ProtocolVersion.V2,
                currency0AmountUsd: token0USD,
                currency1AmountUsd: token1USD,
              }),
              action: `${isNotUniswap ? LiquiditySource.SUSHISWAP : LiquiditySource.V2}->${LiquiditySource.V3}`,
              transaction_hash: response.hash,
            })

            addTransaction(response, {
              type: TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3,
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
            href={getExplorerLink(
              account.chainId ?? UniverseChainId.Mainnet,
              migrator?.address ?? '',
              ExplorerDataType.ADDRESS,
            )}
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
          <TokenPairHeader currency0={currency0} currency1={currency1} badgeText="v3">
            <Trans
              i18nKey="migrate.lpNFT"
              values={{
                symA: currency0.symbol,
                symB: currency1.symbol,
              }}
            />
          </TokenPairHeader>
          <FeeSelector feeAmount={feeAmount} handleFeePoolSelect={setFeeAmount} />
          {noLiquidity && (
            <BlueCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AlertCircle color={theme.neutral1} style={{ marginBottom: '12px', opacity: 0.8 }} />
              <ThemedText.DeprecatedBody
                fontSize={14}
                style={{ marginBottom: 8, fontWeight: 535, opacity: 0.8 }}
                textAlign="center"
              >
                <Trans
                  i18nKey="migrate.firstLP"
                  values={{
                    source: isNotUniswap ? 'SushiSwap' : 'V2',
                  }}
                />
              </ThemedText.DeprecatedBody>

              <ThemedText.DeprecatedBody
                fontWeight="$medium"
                textAlign="center"
                fontSize={14}
                style={{ marginTop: '8px', opacity: 0.8 }}
              >
                <Trans i18nKey="migrate.highGasCost" />
              </ThemedText.DeprecatedBody>

              {v2SpotPrice && (
                <AutoColumn gap="sm" style={{ marginTop: '12px' }}>
                  <RowBetween>
                    <ThemedText.DeprecatedBody fontWeight={535} fontSize={14}>
                      <Trans
                        i18nKey="migrate.symbolPrice"
                        values={{
                          protocolName: isNotUniswap ? 'SushiSwap' : 'V2',
                          tokenSymbol: invertPrice ? currency1.symbol : currency0.symbol,
                        }}
                      />{' '}
                      {invertPrice
                        ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                        : `${v2SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                    </ThemedText.DeprecatedBody>
                  </RowBetween>
                </AutoColumn>
              )}
            </BlueCard>
          )}

          {largePriceDifference ? (
            <YellowCard>
              <AutoColumn gap="sm">
                <RowBetween>
                  <ThemedText.DeprecatedBody fontSize={14}>
                    <Trans
                      i18nKey="migrate.symbolPrice"
                      values={{
                        protocolName: isNotUniswap ? 'SushiSwap' : 'V2',
                        tokenSymbol: invertPrice ? currency1.symbol : currency0.symbol,
                      }}
                    />
                  </ThemedText.DeprecatedBody>
                  <ThemedText.DeprecatedBlack fontSize={14}>
                    {invertPrice
                      ? `${v2SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                      : `${v2SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                  </ThemedText.DeprecatedBlack>
                </RowBetween>

                <RowBetween>
                  <ThemedText.DeprecatedBody fontSize={14}>
                    V3 {invertPrice ? currency1.symbol : currency0.symbol} {t('common.price')}:
                  </ThemedText.DeprecatedBody>
                  <ThemedText.DeprecatedBlack fontSize={14}>
                    {invertPrice
                      ? `${v3SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                      : `${v3SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
                  </ThemedText.DeprecatedBlack>
                </RowBetween>

                <RowBetween>
                  <ThemedText.DeprecatedBody fontSize={14} color="inherit">
                    <Trans i18nKey="migrate.priceDifference" />
                  </ThemedText.DeprecatedBody>
                  <ThemedText.DeprecatedBlack fontSize={14} color="inherit">
                    {priceDifferenceFraction?.toSignificant(4)}%
                  </ThemedText.DeprecatedBlack>
                </RowBetween>
              </AutoColumn>
              <ThemedText.DeprecatedBody fontSize={14} style={{ marginTop: 8, fontWeight: 485 }}>
                <Trans i18nKey="migrate.priceWarning" />
              </ThemedText.DeprecatedBody>
            </YellowCard>
          ) : !noLiquidity && v3SpotPrice ? (
            <RowBetween>
              <ThemedText.DeprecatedBody fontSize={14}>
                <Trans i18nKey="migrate.v3Price" values={{ sym: invertPrice ? currency1.symbol : currency0.symbol }} />
              </ThemedText.DeprecatedBody>
              <ThemedText.DeprecatedBlack fontSize={14}>
                {invertPrice
                  ? `${v3SpotPrice?.invert()?.toSignificant(6)} ${currency0.symbol}`
                  : `${v3SpotPrice?.toSignificant(6)} ${currency1.symbol}`}
              </ThemedText.DeprecatedBlack>
            </RowBetween>
          ) : null}

          <RowBetween>
            <ThemedText.DeprecatedLabel>
              <Trans i18nKey="migrate.setRange" />
            </ThemedText.DeprecatedLabel>
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
                <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                <Text color="$yellow600" ml={12} fontSize={12}>
                  <Trans i18nKey="migrate.positionNoFees" />
                </Text>
              </RowBetween>
            </YellowCard>
          ) : null}

          {invalidRange ? (
            <YellowCard padding="8px 12px" $borderRadius="12px">
              <RowBetween>
                <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                <Text color="$" ml={12} fontSize={12}>
                  <Trans i18nKey="migrate.invalidRange" />
                </Text>
              </RowBetween>
            </YellowCard>
          ) : null}

          {position ? (
            <DarkGrayCard>
              <AutoColumn gap="md">
                <LiquidityInfo token0Amount={position.amount0} token1Amount={position.amount1} />
                {account.chainId && refund0 && refund1 ? (
                  <ThemedText.DeprecatedBlack fontSize={12}>
                    <Trans
                      i18nKey="migrate.refund"
                      values={{
                        amtA: formatCurrencyAmount(refund0, 4),
                        symA:
                          account.chainId && WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(token0)
                            ? 'ETH'
                            : token0.symbol,
                        amtB: formatCurrencyAmount(refund1, 4),
                        symB:
                          account.chainId && WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(token1)
                            ? 'ETH'
                            : token1.symbol,
                      }}
                    />
                  </ThemedText.DeprecatedBlack>
                ) : null}
              </AutoColumn>
            </DarkGrayCard>
          ) : null}

          <AutoColumn gap="md">
            {!isSuccessfullyMigrated && !isMigrationPending ? (
              <AutoColumn gap="md" style={{ flex: '1' }}>
                <Button
                  isDisabled={
                    approval !== ApprovalState.NOT_APPROVED ||
                    signatureData !== null ||
                    !v3Amount0Min ||
                    !v3Amount1Min ||
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
              </AutoColumn>
            ) : null}
            <AutoColumn gap="md" style={{ flex: '1' }}>
              <Button
                isDisabled={
                  !v3Amount0Min ||
                  !v3Amount1Min ||
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
            </AutoColumn>
          </AutoColumn>
        </Flex>
      </LightCard>
    </Flex>
  )
}

export default function MigrateV2Pair() {
  const { address } = useParams<{ address: string }>()
  // reset mint state on component mount, and as a cleanup (on unmount)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  useEffect(() => {
    dispatch(resetMintState())
    return () => {
      dispatch(resetMintState())
    }
  }, [dispatch])

  const account = useAccount()

  // get pair contract
  const validatedAddress = isAddress(address)
  const pair = usePairContract(validatedAddress ? validatedAddress : undefined)

  const { data: pairAddresses, isLoading: pairAddressesLoading } = useReadContracts({
    contracts: [
      { address: validatedAddress || undefined, functionName: 'token0', abi: MIGRATE_V2_ABI },
      { address: validatedAddress || undefined, functionName: 'token1', abi: MIGRATE_V2_ABI },
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
  const isOwner = usePositionOwnerV2(account?.address, liquidityToken?.address, token0?.chainId)
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

  const handleNavigateBackToMigrate = useCallback(() => {
    navigate(MIGRATE_PAGE_URL)
  }, [navigate])

  // redirect for invalid url params
  if (!validatedAddress || !pair || (pair && !pairAddressesLoading && !token0Address && !account.isConnecting)) {
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
      page={InterfacePageNameLocal.MigrateV2Pair}
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
              onPress={handleNavigateBackToMigrate}
              hoverable
              hoverStyle={{
                backgroundColor: '$backgroundHover',
              }}
            >
              <Arrow direction="w" color="$neutral1" size={iconSizes.icon24} />
            </TouchableArea>
            <MigrateHeader>
              <Trans i18nKey="migrate.v2Title" />
            </MigrateHeader>
            <SettingsTab
              autoSlippage={DEFAULT_MIGRATE_SLIPPAGE_TOLERANCE}
              chainId={account.chainId}
              hideRoutingSettings
            />
          </Flex>

          {!account.isConnected || !isOwner ? (
            <ThemedText.DeprecatedLargeHeader>
              <Trans i18nKey="migrate.connectAccount" />
            </ThemedText.DeprecatedLargeHeader>
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
