import React, { useMemo } from 'react'
import { Currency, CurrencyAmount, Price, Token, TokenAmount, WETH9 } from '@uniswap/sdk-core'
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
import { usePairContract } from '../../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { BackArrow, ExternalLink, TYPE } from '../../theme'
import { getEtherscanLink, isAddress } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from '../MigrateV1/EmptyState'
import { V2_MIGRATOR_ADDRESSES } from 'constants/v3'

// TODO the whole file

// const WEI_DENOM = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
// const ZERO = JSBI.BigInt(0)
// const ONE = JSBI.BigInt(1)
// const ZERO_FRACTION = new Fraction(ZERO, ONE)
// const ALLOWED_OUTPUT_MIN_PERCENT = new Percent(JSBI.BigInt(10000 - INITIAL_ALLOWED_SLIPPAGE), JSBI.BigInt(10000))

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
  const { chainId } = useActiveWeb3React()

  // this is just getLiquidityValue with the fee off, but for the passed pair
  const token0Value = useMemo(
    () => new TokenAmount(token0, JSBI.divide(JSBI.multiply(pairBalance.raw, reserve0.raw), totalSupply.raw)),
    [token0, pairBalance, reserve0, totalSupply]
  )
  const token1Value = useMemo(
    () => new TokenAmount(token1, JSBI.divide(JSBI.multiply(pairBalance.raw, reserve1.raw), totalSupply.raw)),
    [token1, pairBalance, reserve1, totalSupply]
  )

  const v2SpotPrice = new Price(token0, token1, reserve0.raw, reserve1.raw)

  console.log(token0Value, token1Value, v2SpotPrice)

  // const isFirstLiquidityProvider: boolean = false // check for v3 pair existence

  // const [confirmingMigration, setConfirmingMigration] = useState<boolean>(false)
  // const [pendingMigrationHash, setPendingMigrationHash] = useState<string | null>(null)

  // const shareFraction: Fraction = totalSupply ? new Percent(liquidityTokenAmount.raw, totalSupply.raw) : ZERO_FRACTION

  // const ethWorth: CurrencyAmount = exchangeETHBalance
  //   ? CurrencyAmount.ether(exchangeETHBalance.multiply(shareFraction).multiply(WEI_DENOM).quotient)
  //   : CurrencyAmount.ether(ZERO)

  // const tokenWorth: TokenAmount = exchangeTokenBalance
  //   ? new TokenAmount(token, shareFraction.multiply(exchangeTokenBalance.raw).quotient)
  //   : new TokenAmount(token, ZERO)

  // const [approval, approve] = useApproveCallback(liquidityTokenAmount, V1_MIGRATOR_ADDRESS)

  // const v1SpotPrice =
  //   exchangeTokenBalance && exchangeETHBalance
  //     ? exchangeTokenBalance.divide(new Fraction(exchangeETHBalance.raw, WEI_DENOM))
  //     : null

  // const priceDifferenceFraction: Fraction | undefined =
  //   v1SpotPrice && v2SpotPrice ? v1SpotPrice.divide(v2SpotPrice).multiply('100').subtract('100') : undefined

  // const priceDifferenceAbs: Fraction | undefined = priceDifferenceFraction?.lessThan(ZERO)
  //   ? priceDifferenceFraction?.multiply('-1')
  //   : priceDifferenceFraction

  // const minAmountETH: JSBI | undefined =
  //   v2SpotPrice && tokenWorth
  //     ? tokenWorth.divide(v2SpotPrice).multiply(WEI_DENOM).multiply(ALLOWED_OUTPUT_MIN_PERCENT).quotient
  //     : ethWorth?.numerator

  // const minAmountToken: JSBI | undefined =
  //   v2SpotPrice && ethWorth
  //     ? ethWorth
  //         .multiply(v2SpotPrice)
  //         .multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(token.decimals)))
  //         .multiply(ALLOWED_OUTPUT_MIN_PERCENT).quotient
  //     : tokenWorth?.numerator

  // const addTransaction = useTransactionAdder()
  // const isMigrationPending = useIsTransactionPending(pendingMigrationHash ?? undefined)

  // const migrator = useV1MigratorContract()
  // const migrate = useCallback(() => {
  //   if (!minAmountToken || !minAmountETH || !migrator) return

  //   setConfirmingMigration(true)
  //   migrator
  //     .migrate(
  //       token.address,
  //       minAmountToken.toString(),
  //       minAmountETH.toString(),
  //       account,
  //       Math.floor(new Date().getTime() / 1000) + DEFAULT_DEADLINE_FROM_NOW
  //     )
  //     .then((response: TransactionResponse) => {
  //       ReactGA.event({
  //         category: 'Migrate',
  //         action: 'V1->V2',
  //         label: token?.symbol,
  //       })

  //       addTransaction(response, {
  //         summary: `Migrate ${token.symbol} liquidity to V2`,
  //       })
  //       setPendingMigrationHash(response.hash)
  //     })
  //     .catch(() => {
  //       setConfirmingMigration(false)
  //     })
  // }, [minAmountToken, minAmountETH, migrator, token, account, addTransaction])

  // const noLiquidityTokens = !!liquidityTokenAmount && liquidityTokenAmount.equalTo(ZERO)

  // const largePriceDifference = !!priceDifferenceAbs && !priceDifferenceAbs.lessThan(JSBI.BigInt(5))

  // const isSuccessfullyMigrated = !!pendingMigrationHash && noLiquidityTokens

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

      {/* {!isFirstLiquidityProvider && largePriceDifference ? (
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
              <TYPE.black color="inherit">{priceDifferenceAbs?.toSignificant(4)}%</TYPE.black>
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
        <V2LiquidityInfo
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
      </TYPE.darkGray> */}
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
