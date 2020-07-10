import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useContext, useState } from 'react'
import { Plus } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { BlueCard, GreyCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFlat } from '../../components/Row'

import { ROUTER_ADDRESS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserDeadline, useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { currencyId } from './currencyId'
import { PoolPriceBar } from './PoolPriceBar'

function useTokenByCurrencyId(chainId: ChainId | undefined, currencyId: string | undefined): Token | undefined {
  const isETH = currencyId?.toUpperCase() === 'ETH'
  const token = useToken(isETH ? undefined : currencyId)
  return isETH && chainId ? WETH[chainId] : token ?? undefined
}

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const tokenA = useTokenByCurrencyId(chainId, currencyIdA)
  const tokenB = useTokenByCurrencyId(chainId, currencyIdB)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    tokens,
    pair,
    tokenBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  } = useDerivedMintInfo(tokenA ?? undefined, tokenB ?? undefined)
  const { onUserInput } = useMintActionHandlers(noLiquidity)

  const handleTokenAInput = useCallback(
    (field: string, value: string) => {
      return onUserInput(Field.TOKEN_A, value)
    },
    [onUserInput]
  )
  const handleTokenBInput = useCallback(
    (field: string, value: string) => {
      return onUserInput(Field.TOKEN_B, value)
    },
    [onUserInput]
  )

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const [deadline] = useUserDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.TOKEN_A, Field.TOKEN_B].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmountSpend(tokenBalances[field])
    }
  }, {})

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.TOKEN_A, Field.TOKEN_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.TOKEN_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.TOKEN_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.TOKEN_A]: parsedAmountA, [Field.TOKEN_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !tokenA || !tokenB) {
      return
    }

    const amountsMin = {
      [Field.TOKEN_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.TOKEN_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
    }

    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (tokenA.equals(WETH[chainId]) || tokenB.equals(WETH[chainId])) {
      const tokenBIsETH = tokenB.equals(WETH[chainId])
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        (tokenBIsETH ? tokenA : tokenB).address, // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.TOKEN_A : Field.TOKEN_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.TOKEN_B : Field.TOKEN_A].toString(), // eth min
        account,
        deadlineFromNow
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        tokenA.address,
        tokenB.address,
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.TOKEN_A].toString(),
        amountsMin[Field.TOKEN_B].toString(),
        account,
        deadlineFromNow
      ]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.TOKEN_A]?.toSignificant(3) +
              ' ' +
              tokens[Field.TOKEN_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.TOKEN_B]?.toSignificant(3) +
              ' ' +
              tokens[Field.TOKEN_B]?.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [tokens[Field.TOKEN_A]?.symbol, tokens[Field.TOKEN_B]?.symbol].join('/')
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="20px">
        <LightCard mt="20px" borderRadius="20px">
          <RowFlat>
            <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
              {tokens[Field.TOKEN_A]?.symbol + '/' + tokens[Field.TOKEN_B]?.symbol}
            </Text>
            <DoubleLogo a0={tokens[Field.TOKEN_A]?.address} a1={tokens[Field.TOKEN_B]?.address} size={30} />
          </RowFlat>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {liquidityMinted?.toSignificant(6)}
          </Text>
          <DoubleLogo a0={tokens[Field.TOKEN_A]?.address} a1={tokens[Field.TOKEN_B]?.address} size={30} />
        </RowFlat>
        <Row>
          <Text fontSize="24px">
            {tokens[Field.TOKEN_A]?.symbol + '/' + tokens[Field.TOKEN_B]?.symbol + ' Pool Tokens'}
          </Text>
        </Row>
        <TYPE.italic fontSize={12} textAlign="left" padding={'8px 0 0 0 '}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        tokens={tokens}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.TOKEN_A]?.toSignificant(6)} ${
    tokens[Field.TOKEN_A]?.symbol
  } and ${parsedAmounts[Field.TOKEN_B]?.toSignificant(6)} ${tokens[Field.TOKEN_B]?.symbol}`

  const handleTokenASelect = useCallback(
    (tokenAddress: string) => {
      const [tokenAId, tokenBId] = [
        currencyId(chainId, tokenAddress),
        tokenB ? currencyId(chainId, tokenB.address) : undefined
      ]
      if (tokenAId === tokenBId) {
        history.push(`/add/${tokenAId}/${tokenA ? currencyId(chainId, tokenA.address) : ''}`)
      } else {
        history.push(`/add/${tokenAId}/${tokenBId}`)
      }
    },
    [chainId, tokenB, history, tokenA]
  )
  const handleTokenBSelect = useCallback(
    (tokenAddress: string) => {
      const [tokenAId, tokenBId] = [
        tokenA ? currencyId(chainId, tokenA.address) : undefined,
        currencyId(chainId, tokenAddress)
      ]
      if (tokenAId === tokenBId) {
        history.push(`/add/${tokenB ? currencyId(chainId, tokenB.address) : ''}/${tokenAId}`)
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : 'ETH'}/${currencyId(chainId, tokenAddress)}`)
      }
    },
    [tokenA, chainId, history, tokenB, currencyIdA]
  )

  return (
    <>
      <AppBody>
        <AddRemoveTabs adding={true} />
        <Wrapper>
          <ConfirmationModal
            isOpen={showConfirm}
            onDismiss={() => {
              setShowConfirm(false)
              // if there was a tx hash, we want to clear the input
              if (txHash) {
                onUserInput(Field.TOKEN_A, '')
              }
              setTxHash('')
            }}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            topContent={() => modalHeader()}
            bottomContent={modalBottom}
            pendingText={pendingText}
            title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
          />
          <AutoColumn gap="20px">
            {noLiquidity && (
              <ColumnCenter>
                <BlueCard>
                  <AutoColumn gap="10px">
                    <TYPE.link fontWeight={600} color={'primaryText1'}>
                      You are the first liquidity provider.
                    </TYPE.link>
                    <TYPE.link fontWeight={400} color={'primaryText1'}>
                      The ratio of tokens you add will set the price of this pool.
                    </TYPE.link>
                    <TYPE.link fontWeight={400} color={'primaryText1'}>
                      Once you are happy with the rate click supply to review.
                    </TYPE.link>
                  </AutoColumn>
                </BlueCard>
              </ColumnCenter>
            )}
            <CurrencyInputPanel
              field={Field.TOKEN_A}
              value={formattedAmounts[Field.TOKEN_A]}
              onUserInput={handleTokenAInput}
              onMax={() => {
                onUserInput(Field.TOKEN_A, maxAmounts[Field.TOKEN_A]?.toExact() ?? '')
              }}
              onTokenSelection={handleTokenASelect}
              showMaxButton={!atMaxAmounts[Field.TOKEN_A]}
              token={tokens[Field.TOKEN_A]}
              pair={pair}
              id="add-liquidity-input-tokena"
              showCommonBases
            />
            <ColumnCenter>
              <Plus size="16" color={theme.text2} />
            </ColumnCenter>
            <CurrencyInputPanel
              field={Field.TOKEN_B}
              value={formattedAmounts[Field.TOKEN_B]}
              onUserInput={handleTokenBInput}
              onTokenSelection={handleTokenBSelect}
              onMax={() => {
                onUserInput(Field.TOKEN_B, maxAmounts[Field.TOKEN_B]?.toExact() ?? '')
              }}
              showMaxButton={!atMaxAmounts[Field.TOKEN_B]}
              token={tokens[Field.TOKEN_B]}
              pair={pair}
              id="add-liquidity-input-tokenb"
              showCommonBases
            />
            {tokens[Field.TOKEN_A] && tokens[Field.TOKEN_B] && (
              <>
                <GreyCard padding="0px" borderRadius={'20px'}>
                  <RowBetween padding="1rem">
                    <TYPE.subHeader fontWeight={500} fontSize={14}>
                      {noLiquidity ? 'Initial prices' : 'Prices'} and pool share
                    </TYPE.subHeader>
                  </RowBetween>{' '}
                  <LightCard padding="1rem" borderRadius={'20px'}>
                    <PoolPriceBar
                      tokens={tokens}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </LightCard>
                </GreyCard>
              </>
            )}

            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>Approving {tokens[Field.TOKEN_A]?.symbol}</Dots>
                          ) : (
                            'Approve ' + tokens[Field.TOKEN_A]?.symbol
                          )}
                        </ButtonPrimary>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>Approving {tokens[Field.TOKEN_B]?.symbol}</Dots>
                          ) : (
                            'Approve ' + tokens[Field.TOKEN_B]?.symbol
                          )}
                        </ButtonPrimary>
                      )}
                    </RowBetween>
                  )}
                <ButtonError
                  onClick={() => {
                    expertMode ? onAdd() : setShowConfirm(true)
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                  error={!isValid && !!parsedAmounts[Field.TOKEN_A] && !!parsedAmounts[Field.TOKEN_B]}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {error ?? 'Supply'}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {pair && !noLiquidity ? (
        <AutoColumn style={{ minWidth: '20rem', marginTop: '1rem' }}>
          <MinimalPositionCard pair={pair} />
        </AutoColumn>
      ) : null}
    </>
  )
}
