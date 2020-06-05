import { BigNumber } from '@ethersproject/bignumber'
import { TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useState } from 'react'
import { Plus } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonLight, ButtonPrimary, ButtonError } from '../../components/Button'
import { BlueCard, GreyCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleLogo from '../../components/DoubleLogo'
import PositionCard from '../../components/PositionCard'
import Row, { AutoRow, RowBetween, RowFixed, RowFlat } from '../../components/Row'

import TokenLogo from '../../components/TokenLogo'

import { ROUTER_ADDRESS, MIN_ETH, ONE_BIPS, DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE } from '../../constants'
import { useActiveWeb3React } from '../../hooks'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import {
  useDefaultsFromURLMatchParams,
  useMintState,
  useDerivedMintInfo,
  useMintActionHandlers
} from '../../state/mint/hooks'
import { Field } from '../../state/mint/actions'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'

export default function AddLiquidity({ match: { params }, history }: RouteComponentProps<{ tokens: string }>) {
  useDefaultsFromURLMatchParams(params)

  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

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
  } = useDerivedMintInfo()
  const { onUserInput } = useMintActionHandlers()

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true) // waiting for user confirmation

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [deadline, setDeadline] = useState<number>(DEFAULT_DEADLINE_FROM_NOW)
  const [allowedSlippage, setAllowedSlippage] = useState<number>(INITIAL_ALLOWED_SLIPPAGE)

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.TOKEN_A, Field.TOKEN_B].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]:
        !!tokenBalances[field] &&
        !!tokens[field] &&
        !!WETH[chainId] &&
        tokenBalances[field].greaterThan(
          new TokenAmount(tokens[field], tokens[field].equals(WETH[chainId]) ? MIN_ETH : '0')
        )
          ? tokens[field].equals(WETH[chainId])
            ? tokenBalances[field].subtract(new TokenAmount(WETH[chainId], MIN_ETH))
            : tokenBalances[field]
          : undefined
    }
  }, {})

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.TOKEN_A, Field.TOKEN_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field] && parsedAmounts[field] ? maxAmounts[field].equalTo(parsedAmounts[field]) : undefined
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.TOKEN_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.TOKEN_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()
  async function onAdd() {
    setAttemptingTxn(true)

    const router = getRouterContract(chainId, library, account)

    const amountsMin = {
      [Field.TOKEN_A]: calculateSlippageAmount(parsedAmounts[Field.TOKEN_A], noLiquidity ? 0 : allowedSlippage)[0],
      [Field.TOKEN_B]: calculateSlippageAmount(parsedAmounts[Field.TOKEN_B], noLiquidity ? 0 : allowedSlippage)[0]
    }

    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    let estimate, method: Function, args: Array<string | string[] | number>, value: BigNumber | null
    if (tokens[Field.TOKEN_A].equals(WETH[chainId]) || tokens[Field.TOKEN_B].equals(WETH[chainId])) {
      const tokenBIsETH = tokens[Field.TOKEN_B].equals(WETH[chainId])
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        tokens[tokenBIsETH ? Field.TOKEN_A : Field.TOKEN_B].address, // token
        parsedAmounts[tokenBIsETH ? Field.TOKEN_A : Field.TOKEN_B].raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.TOKEN_A : Field.TOKEN_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.TOKEN_B : Field.TOKEN_A].toString(), // eth min
        account,
        deadlineFromNow
      ]
      value = BigNumber.from(parsedAmounts[tokenBIsETH ? Field.TOKEN_B : Field.TOKEN_A].raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        tokens[Field.TOKEN_A].address,
        tokens[Field.TOKEN_B].address,
        parsedAmounts[Field.TOKEN_A].raw.toString(),
        parsedAmounts[Field.TOKEN_B].raw.toString(),
        amountsMin[Field.TOKEN_A].toString(),
        amountsMin[Field.TOKEN_B].toString(),
        account,
        deadlineFromNow
      ]
      value = null
    }

    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
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
          setPendingConfirmation(false)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [tokens[Field.TOKEN_A]?.symbol, tokens[Field.TOKEN_B]?.symbol].join('/')
          })
        })
      )
      .catch((e: Error) => {
        console.error(e)
        setPendingConfirmation(true)
        setAttemptingTxn(false)
        setShowConfirm(false)
        setShowAdvanced(false)
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
      <>
        <RowBetween>
          <TYPE.body>{tokens[Field.TOKEN_A]?.symbol} Deposited</TYPE.body>
          <RowFixed>
            <TokenLogo address={tokens[Field.TOKEN_A]?.address} style={{ marginRight: '8px' }} />
            <TYPE.body>{parsedAmounts[Field.TOKEN_A]?.toSignificant(6)}</TYPE.body>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <TYPE.body>{tokens[Field.TOKEN_B]?.symbol} Deposited</TYPE.body>
          <RowFixed>
            <TokenLogo address={tokens[Field.TOKEN_B]?.address} style={{ marginRight: '8px' }} />
            <TYPE.body>{parsedAmounts[Field.TOKEN_B]?.toSignificant(6)}</TYPE.body>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <TYPE.body>Rates</TYPE.body>
          <TYPE.body>
            {`1 ${tokens[Field.TOKEN_A]?.symbol} = ${price?.toSignificant(4)} ${tokens[Field.TOKEN_B]?.symbol}`}
          </TYPE.body>
        </RowBetween>
        <RowBetween style={{ justifyContent: 'flex-end' }}>
          <TYPE.body>
            {`1 ${tokens[Field.TOKEN_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
              tokens[Field.TOKEN_A]?.symbol
            }`}
          </TYPE.body>
        </RowBetween>
        <RowBetween>
          <TYPE.body>Share of Pool:</TYPE.body>
          <TYPE.body>{noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</TYPE.body>
        </RowBetween>
        <ButtonPrimary style={{ margin: '20px 0 0 0' }} onClick={onAdd}>
          <Text fontWeight={500} fontSize={20}>
            {noLiquidity ? 'Create Pool & Supply' : 'Confirm Supply'}
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const PriceBar = () => {
    return (
      <AutoColumn gap="md" justify="space-between">
        <AutoRow justify="space-between">
          <AutoColumn justify="center">
            <TYPE.black>{price?.toSignificant(6) ?? '0'}</TYPE.black>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {tokens[Field.TOKEN_B]?.symbol} per {tokens[Field.TOKEN_A]?.symbol}
            </Text>
          </AutoColumn>
          <AutoColumn justify="center">
            <TYPE.black>{price?.invert().toSignificant(6) ?? '0'}</TYPE.black>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {tokens[Field.TOKEN_A]?.symbol} per {tokens[Field.TOKEN_B]?.symbol}
            </Text>
          </AutoColumn>
          <AutoColumn justify="center">
            <TYPE.black>
              {noLiquidity && price
                ? '100'
                : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
              %
            </TYPE.black>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              Share of Pool
            </Text>
          </AutoColumn>
        </AutoRow>
      </AutoColumn>
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.TOKEN_A]?.toSignificant(6)} ${
    tokens[Field.TOKEN_A]?.symbol
  } and ${parsedAmounts[Field.TOKEN_B]?.toSignificant(6)} ${tokens[Field.TOKEN_B]?.symbol}`

  return (
    <>
      <AppBody>
        <Wrapper>
          <ConfirmationModal
            isOpen={showConfirm}
            onDismiss={() => {
              if (attemptingTxn) {
                history.push('/pool')
                return
              }
              setPendingConfirmation(true)
              setAttemptingTxn(false)
              setShowConfirm(false)
            }}
            attemptingTxn={attemptingTxn}
            pendingConfirmation={pendingConfirmation}
            hash={txHash ? txHash : ''}
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
              disableTokenSelect={true}
              field={Field.TOKEN_A}
              value={formattedAmounts[Field.TOKEN_A]}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmounts[Field.TOKEN_A] && onUserInput(Field.TOKEN_A, maxAmounts[Field.TOKEN_A].toExact())
              }}
              showMaxButton={!atMaxAmounts[Field.TOKEN_A]}
              token={tokens[Field.TOKEN_A]}
              pair={pair}
              label="Input"
              id="add-liquidity-input-tokena"
            />
            <ColumnCenter>
              <Plus size="16" color={theme.text2} />
            </ColumnCenter>
            <CurrencyInputPanel
              disableTokenSelect={true}
              field={Field.TOKEN_B}
              value={formattedAmounts[Field.TOKEN_B]}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmounts[Field.TOKEN_B] && onUserInput(Field.TOKEN_B, maxAmounts[Field.TOKEN_B].toExact())
              }}
              showMaxButton={!atMaxAmounts[Field.TOKEN_B]}
              token={tokens[Field.TOKEN_B]}
              pair={pair}
              id="add-liquidity-input-tokenb"
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
                    <PriceBar />
                  </LightCard>
                </GreyCard>
              </>
            )}

            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : approvalA === ApprovalState.NOT_APPROVED || approvalA === ApprovalState.PENDING ? (
              <ButtonLight onClick={approveACallback} disabled={approvalA === ApprovalState.PENDING}>
                {approvalA === ApprovalState.PENDING ? (
                  <Dots>Approving {tokens[Field.TOKEN_A]?.symbol}</Dots>
                ) : (
                  'Approve ' + tokens[Field.TOKEN_A]?.symbol
                )}
              </ButtonLight>
            ) : approvalB === ApprovalState.NOT_APPROVED || approvalB === ApprovalState.PENDING ? (
              <ButtonLight onClick={approveBCallback} disabled={approvalB === ApprovalState.PENDING}>
                {approvalB === ApprovalState.PENDING ? (
                  <Dots>Approving {tokens[Field.TOKEN_B]?.symbol}</Dots>
                ) : (
                  'Approve ' + tokens[Field.TOKEN_B]?.symbol
                )}
              </ButtonLight>
            ) : (
              <ButtonError
                onClick={() => {
                  setShowConfirm(true)
                }}
                disabled={!isValid}
                error={!isValid && !!parsedAmounts[Field.TOKEN_A] && !!parsedAmounts[Field.TOKEN_B]}
              >
                <Text fontSize={20} fontWeight={500}>
                  {error ?? 'Supply'}
                </Text>
              </ButtonError>
            )}
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {isValid && !!parsedAmounts[Field.TOKEN_A] && !!parsedAmounts[Field.TOKEN_B] ? (
        <AdvancedSwapDetailsDropdown
          rawSlippage={allowedSlippage}
          deadline={deadline}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          setDeadline={setDeadline}
          setRawSlippage={setAllowedSlippage}
        />
      ) : null}

      {pair && !noLiquidity ? (
        <AutoColumn style={{ minWidth: '20rem', marginTop: '1rem' }}>
          <PositionCard pair={pair} minimal={true} />
        </AutoColumn>
      ) : null}
    </>
  )
}
