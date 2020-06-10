import { TransactionResponse } from '@ethersproject/abstract-provider'
import { JSBI, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga'
import { Redirect, RouteComponentProps } from 'react-router'
import { ButtonConfirmed } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow } from '../../components/Row'
import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useV1ExchangeContract } from '../../hooks/useContract'
import { NEVER_RELOAD, useSingleCallResult } from '../../state/multicall/hooks'
import { useIsTransactionPending, useTransactionAdder } from '../../state/transactions/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { isAddress } from '../../utils'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from './EmptyState'
import TokenLogo from '../../components/TokenLogo'
import { FormattedPoolTokenAmount } from './MigrateV1Exchange'
import { AddressZero } from '@ethersproject/constants'
import { Dots } from '../../components/swap/styleds'
import { Contract } from '@ethersproject/contracts'

const ZERO = JSBI.BigInt(0)

function V1PairRemoval({
  exchangeContract,
  liquidityTokenAmount,
  token
}: {
  exchangeContract: Contract
  liquidityTokenAmount: TokenAmount
  token: Token
}) {
  const { chainId } = useActiveWeb3React()

  const [confirmingRemoval, setConfirmingRemoval] = useState<boolean>(false)
  const [pendingRemovalHash, setPendingRemovalHash] = useState<string | null>(null)

  const addTransaction = useTransactionAdder()
  const isRemovalPending = useIsTransactionPending(pendingRemovalHash)

  const remove = useCallback(() => {
    if (!liquidityTokenAmount) return

    setConfirmingRemoval(true)
    exchangeContract
      .removeLiquidity(
        liquidityTokenAmount.raw.toString(),
        1,
        1,
        Math.floor(new Date().getTime() / 1000) + DEFAULT_DEADLINE_FROM_NOW
      )
      .then((response: TransactionResponse) => {
        ReactGA.event({
          category: 'Remove',
          action: 'V1',
          label: token?.symbol
        })

        addTransaction(response, {
          summary: `Remove ${token.equals(WETH[chainId]) ? 'WETH' : token.symbol}/ETH V1 liquidity`
        })
        setPendingRemovalHash(response.hash)
      })
      .catch(error => {
        console.error(error)
        setConfirmingRemoval(false)
      })
  }, [exchangeContract, liquidityTokenAmount, token, chainId, addTransaction])

  const noLiquidityTokens = liquidityTokenAmount && liquidityTokenAmount.equalTo(ZERO)

  const isSuccessfullyMigrated = Boolean(noLiquidityTokens && pendingRemovalHash)

  return (
    <AutoColumn gap="20px">
      <LightCard>
        <AutoRow style={{ justifyContent: 'flex-start', width: 'fit-content' }}>
          <TokenLogo size="24px" address={token.address} />{' '}
          <div style={{ marginLeft: '.75rem' }}>
            <TYPE.mediumHeader>
              {<FormattedPoolTokenAmount tokenAmount={liquidityTokenAmount} />}{' '}
              {token.equals(WETH[chainId]) ? 'WETH' : token.symbol}/ETH Pool Tokens
            </TYPE.mediumHeader>
          </div>
        </AutoRow>
        <div style={{ display: 'flex', marginTop: '1rem' }}>
          <ButtonConfirmed
            confirmed={isSuccessfullyMigrated}
            disabled={isSuccessfullyMigrated || noLiquidityTokens || isRemovalPending || confirmingRemoval}
            onClick={remove}
          >
            {isSuccessfullyMigrated ? 'Success' : isRemovalPending ? <Dots>Removing</Dots> : 'Remove'}
          </ButtonConfirmed>
        </div>
      </LightCard>
      <TYPE.darkGray style={{ textAlign: 'center' }}>
        {`Your Uniswap V1 ${
          token.equals(WETH[chainId]) ? 'WETH' : token.symbol
        }/ETH liquidity will be redeemed for underlying assets.`}
      </TYPE.darkGray>
    </AutoColumn>
  )
}

export default function RemoveV1Exchange({
  history,
  match: {
    params: { address }
  }
}: RouteComponentProps<{ address: string }>) {
  const validatedAddress = isAddress(address)
  const { chainId, account } = useActiveWeb3React()

  const exchangeContract = useV1ExchangeContract(validatedAddress ? validatedAddress : undefined, true)
  const tokenAddress = useSingleCallResult(exchangeContract, 'tokenAddress', undefined, NEVER_RELOAD)?.result?.[0]
  const token = useTokenByAddressAndAutomaticallyAdd(tokenAddress)

  const liquidityToken: Token | undefined = useMemo(
    () =>
      validatedAddress && token
        ? new Token(chainId, validatedAddress, 18, `UNI-V1-${token.symbol}`, 'Uniswap V1')
        : undefined,
    [chainId, validatedAddress, token]
  )
  const userLiquidityBalance = useTokenBalance(account, liquidityToken)

  const handleBack = useCallback(() => {
    history.push('/pool')
  }, [history])

  // redirect for invalid url params
  if (!validatedAddress || tokenAddress === AddressZero) {
    console.error('Invalid address in path', address)
    return <Redirect to="/pool" />
  }

  return (
    <BodyWrapper style={{ padding: 24 }}>
      <AutoColumn gap="16px">
        <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
          <div style={{ cursor: 'pointer' }}>
            <ArrowLeft onClick={handleBack} />
          </div>
          <TYPE.mediumHeader>Remove V1 Liquidity</TYPE.mediumHeader>
          <div>
            <QuestionHelper text="Remove your Uniswap V1 liquidity tokens." />
          </div>
        </AutoRow>

        {!account ? (
          <TYPE.largeHeader>You must connect an account.</TYPE.largeHeader>
        ) : userLiquidityBalance && token ? (
          <V1PairRemoval
            exchangeContract={exchangeContract}
            liquidityTokenAmount={userLiquidityBalance}
            token={token}
          />
        ) : (
          <EmptyState message="Loading..." />
        )}
      </AutoColumn>
    </BodyWrapper>
  )
}
