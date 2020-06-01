import { ChainId, Fraction, JSBI, Percent, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import DoubleTokenLogo from '../../components/DoubleLogo'
import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants'
import { MIGRATOR_ADDRESS } from '../../constants/abis/migrator'
import { usePair } from '../../data/Reserves'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useV1ExchangeContract, useV2MigratorContract } from '../../hooks/useContract'
import { useSingleCallResult, useSingleContractMultipleData } from '../../state/multicall/hooks'
import { useETHBalances, useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'

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

export default function MigrateV1Exchange({
  match: {
    params: { address }
  }
}: RouteComponentProps<{ address: string }>) {
  const validated = isAddress(address)
  const { chainId, account } = useActiveWeb3React()

  const liquidityToken: Token | undefined = useMemo(() => (validated ? new Token(chainId, validated, 18) : undefined), [
    chainId,
    validated
  ])

  const userLiquidityBalance = useTokenBalance(account, liquidityToken)

  const exchangeContract = useV1ExchangeContract(validated ? validated : undefined)

  const tokenAddress = useSingleCallResult(exchangeContract, 'tokenAddress')?.result?.[0]

  const token = useToken(tokenAddress)

  if (!validated) {
    console.error('Invalid address in path', address)
    return <Redirect to="/migrate/v1" />
  }

  if (!token || !userLiquidityBalance) return null

  return <V1PairMigration liquidityTokenAmount={userLiquidityBalance} token={token} />
}
