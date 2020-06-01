import { ChainId, Fraction, JSBI, Pair, Percent, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import DoubleTokenLogo from '../../components/DoubleLogo'
import { useTotalSupply } from '../../data/TotalSupply'
import { useAllTokenV1Exchanges } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useETHBalances, useTokenBalance, useTokenBalances } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { shortenAddress } from '../../utils'

const WEI_DENOM = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
const ZERO = JSBI.BigInt(0)
const ONE = JSBI.BigInt(1)
const ZERO_FRACTION = new Fraction(ZERO, ONE)

function V1PairMigration({ liquidityTokenAmount, token }: { liquidityTokenAmount: TokenAmount; token: Token }) {
  const totalSupply = useTotalSupply(liquidityTokenAmount.token)
  const ethBalance = useETHBalances([liquidityTokenAmount.token.address])?.[liquidityTokenAmount.token.address]
  const tokenBalance = useTokenBalance(liquidityTokenAmount.token.address, token)

  const sharePercent =
    ethBalance && totalSupply ? new Percent(liquidityTokenAmount.raw, totalSupply.raw) : ZERO_FRACTION

  const ethWorth: Fraction = ethBalance
    ? new Fraction(sharePercent.multiply(ethBalance).quotient, WEI_DENOM)
    : ZERO_FRACTION

  const tokenWorth: TokenAmount = tokenBalance
    ? new TokenAmount(token, sharePercent.multiply(tokenBalance.raw).quotient)
    : new TokenAmount(token, ZERO)

  return (
    <div>
      <DoubleTokenLogo a0={WETH[ChainId.MAINNET].address} a1={token.address} />
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
        <dt>Pair ETH balance</dt>
        <dd>
          {new Fraction(
            ethBalance?.toString() ?? '0',
            JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
          ).toSignificant(6)}
        </dd>
        <dt>Pair {token.symbol} balance</dt>
        <dd>{tokenBalance?.toSignificant(6)}</dd>
      </dl>
    </div>
  )
}

export default function MigrateV1({}: RouteComponentProps) {
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
      <div style={{ maxWidth: 600, padding: 15 }}>
        <TYPE.largeHeader>Uniswap V2 Migration</TYPE.largeHeader>
      </div>
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
