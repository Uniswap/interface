import { ChainId, Fraction, JSBI, Percent, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import DoubleTokenLogo from '../../components/DoubleLogo'
import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants'
import { MIGRATOR_ADDRESS } from '../../constants/abis/migrator'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'
import { useAllTokenV1Exchanges } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV2MigratorContract } from '../../hooks/useContract'
import { useETHBalances, useTokenBalance, useTokenBalances } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { shortenAddress } from '../../utils'
import AppBody from '../AppBody'

const WEI_DENOM = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const ZERO_FRACTION = new Fraction(ZERO, ONE)
const ALLOWED_OUTPUT_MIN_PERCENT = new Percent(JSBI.BigInt(99), JSBI.BigInt(100))

function V1PairMigration({ liquidityTokenAmount, token }: { liquidityTokenAmount: TokenAmount; token: Token }) {
  const { account, chainId } = useActiveWeb3React()
  const totalSupply = useTotalSupply(liquidityTokenAmount.token)
  const exchangeETHBalance = useETHBalances([liquidityTokenAmount.token.address])?.[liquidityTokenAmount.token.address]
  const exchangeTokenBalance = useTokenBalance(liquidityTokenAmount.token.address, token)

  const v2Pair = usePair(WETH[chainId as ChainId], token)

  const v2SpotPrice = v2Pair?.reserveOf(token)?.divide(v2Pair?.reserveOf(WETH[chainId as ChainId]))

  const [migrating, setMigrating] = useState<boolean>(false)

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

  // whether the refund is expected in ETH or the token
  const refundInETH: boolean | undefined = v2SpotPrice && v1SpotPrice ? v2SpotPrice.lessThan(v1SpotPrice) : undefined

  const migrator = useV2MigratorContract()
  const migrate = useCallback(() => {
    setMigrating(true)
    migrator
      .migrate(
        token.address,
        ALLOWED_OUTPUT_MIN_PERCENT.multiply(tokenWorth.raw).quotient.toString(),
        ALLOWED_OUTPUT_MIN_PERCENT.multiply(ethWorth.numerator).quotient.toString(),
        account,
        Math.floor(new Date().getTime() / 1000) + DEFAULT_DEADLINE_FROM_NOW
      )
      .then(() => {
        setMigrating(false)
      })
      .catch(() => {
        setMigrating(false)
      })
  }, [account, ethWorth.numerator, migrator, token.address, tokenWorth.raw])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ marginRight: 20 }}>
          <DoubleTokenLogo size={24} a0={WETH[ChainId.MAINNET].address} a1={token.address} />
        </div>
        <TYPE.mediumHeader style={{ flex: '1' }}>ETH/{token.symbol}</TYPE.mediumHeader>
      </div>
      <dl>
        <dt>Exchange</dt>
        <dd>{shortenAddress(liquidityTokenAmount.token.address)}</dd>
        <dt>Total Supply</dt>
        <dd>{totalSupply?.toSignificant(6)}</dd>
        <dt>Your # shares</dt>
        <dd>{liquidityTokenAmount.toSignificant(6)}</dd>
        <dt>Share %</dt>
        <dd>{sharePercent.toSignificant(6)}%</dd>
        <dt>Worth ETH</dt>
        <dd>{ethWorth.toSignificant(6)}</dd>
        <dt>Worth {token.symbol}</dt>
        <dd>{tokenWorth.toSignificant(6)}</dd>
        <dt>V1 ETH price</dt>
        <dd>
          {v1SpotPrice?.toSignificant(6)} {token.symbol}/ETH
        </dd>
        <dt>V1 {token.symbol} Price</dt>
        <dd>
          {v1SpotPrice?.invert()?.toSignificant(6)} ETH/{token.symbol}
        </dd>
        <dt>V2 ETH price</dt>
        <dd>
          {v2SpotPrice?.toSignificant(6)} {token.symbol}/ETH
        </dd>
        <dt>V2 {token.symbol} Price</dt>
        <dd>
          {v2SpotPrice?.invert()?.toSignificant(6)} ETH/{token.symbol}
        </dd>
        <dt>Pair ETH balance</dt>
        <dd>
          {new Fraction(
            exchangeETHBalance?.toString() ?? '0',
            JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
          ).toSignificant(6)}
        </dd>
        <dt>Pair {token.symbol} balance</dt>
        <dd>{exchangeTokenBalance?.toSignificant(6)}</dd>
      </dl>
      <div style={{ display: 'flex' }}>
        <ButtonSecondary disabled={approval !== ApprovalState.NOT_APPROVED} onClick={approve}>
          Approve
        </ButtonSecondary>
        <ButtonPrimary disabled={approval !== ApprovalState.APPROVED || migrating} onClick={migrate}>
          Migrate
        </ButtonPrimary>
      </div>
    </div>
  )
}

export default function MigrateV1() {
  const { account, chainId } = useActiveWeb3React()
  const allV1Exchanges = useAllTokenV1Exchanges()

  const v1LiquidityTokens: Token[] = useMemo(() => {
    return Object.keys(allV1Exchanges).map(exchangeAddress => new Token(chainId, exchangeAddress, 18))
  }, [chainId, allV1Exchanges])

  const v1LiquidityBalances = useTokenBalances(account, v1LiquidityTokens)

  const unmigratedLiquidityExchangeAddresses = useMemo(
    () =>
      Object.keys(v1LiquidityBalances)
        .filter(tokenAddress =>
          v1LiquidityBalances[tokenAddress]
            ? JSBI.greaterThan(v1LiquidityBalances[tokenAddress]?.raw, JSBI.BigInt(0))
            : false
        )
        .map(tokenAddress => v1LiquidityBalances[tokenAddress])
        .sort(),
    [v1LiquidityBalances]
  )

  return (
    <div>
      <TYPE.largeHeader>Uniswap V2 Migration</TYPE.largeHeader>
      {unmigratedLiquidityExchangeAddresses?.map(amount => (
        <V1PairMigration
          key={amount.token.address}
          liquidityTokenAmount={amount}
          token={allV1Exchanges[amount.token.address]}
        />
      ))}
    </div>
  )
}
