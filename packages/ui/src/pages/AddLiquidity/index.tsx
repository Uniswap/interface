import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from '@teleswap/sdk'
import bn from 'bignumber.js'
import CurrencyLogo from 'components/CurrencyLogo'
import { BackToMyLiquidity } from 'components/LiquidityDetail'
import QuestionHelper from 'components/QuestionHelper'
import Settings from 'components/Settings'
// import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { useIsTransactionUnsupported } from 'hooks/Trades'
import { usePresetPeripheryAddress } from 'hooks/usePresetContractAddress'
import useThemedContext from 'hooks/useThemedContext'
import React, { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import ReactGA from 'react-ga'
import { useHistory, useParams } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'
import getRoutePairMode from 'utils/getRoutePairMode'

import AddIcon from '../../assets/svg/add.svg'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
// import { MinimalPositionCardPart } from '../../components/PositionCard'
import { AutoRow, RowBetween } from '../../components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { PairState } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { Dots } from '../Liquidity/styles'

const BorderVerticalContainer = styled(Flex)`
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  padding: 32px 24px;
  border-radius: 24px;
  flex-direction: column;
  color: white;
  gap: 24px;
`

const CustomizedRadio = styled.input`
  appearance: none;
  border: 1px solid #4ed7b6;
  width: 0.7rem;
  height: 0.7rem;
  margin: 0;
  border-radius: 50%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  :before {
    content: '';
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background-color: #4ed7b6;
    transition: 120ms all ease-in-out;
    box-shadow: inset 0.35rem 0.35rem #4ed7b6;
    transform: scale(0);
    position: absolute;
  }
  :checked {
    :before {
      transform: scale(0.5);
    }
  }
`

export default function AddLiquidity() {
  const history = useHistory()
  const { currencyIdA, currencyIdB, stable } = useParams<{ currencyIdA: string; currencyIdB: string; stable: string }>()
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useThemedContext()
  const [pairModeStable, setPairModeStable] = useState(false)
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(currencyA, WETH[chainId])) ||
        (currencyB && currencyEquals(currencyB, WETH[chainId])))
  )

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined, pairModeStable)

  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = useMemo(() => !error, [error])

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field])
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
      }
    },
    {}
  )
  const { ROUTER: ROUTER_ADDRESS } = usePresetPeripheryAddress()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

  const onAdd = useCallback(async () => {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)
    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<
        string | string[] | number | { from: string | undefined; to: string | undefined; stable: boolean } | Array<any>
      >,
      value: BigNumber | null
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        // {
        //   from: wrappedCurrency(currencyA, chainId)?.address,
        //   to: wrappedCurrency(currencyB, chainId)?.address,
        //   stable: true,
        // },
        [
          tokenBIsETH
            ? wrappedCurrency(currencyA, chainId)?.address ?? ''
            : wrappedCurrency(currencyB, chainId)?.address ?? '',
          tokenBIsETH
            ? wrappedCurrency(currencyB, chainId)?.address ?? ''
            : wrappedCurrency(currencyA, chainId)?.address ?? '',
          getRoutePairMode()
        ],
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString()
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        [
          wrappedCurrency(currencyA, chainId)?.address ?? '',
          wrappedCurrency(currencyB, chainId)?.address ?? '',
          pairModeStable
        ],
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString()
      ]
      value = null
    }
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) => {
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_B]?.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/')
          })
        })
      })
      .catch((error) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }, [
    account,
    addTransaction,
    allowedSlippage,
    chainId,
    currencies,
    currencyA,
    currencyB,
    deadline,
    library,
    noLiquidity,
    pairModeStable,
    parsedAmounts
  ])

  const isNew = history.location.pathname.includes('/create')

  const modalHeader = useCallback(() => {
    return (
      <Flex flexDirection={'column'} sx={{ gap: '24px', marginTop: '24px' }}>
        {/* <Text fontSize="48px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {liquidityMinted?.toSignificant(6)}
          </Text> */}
        {/*    <DoubleCurrencyLogoVertical
            currency0={currencies[Field.CURRENCY_A]}
            currency1={currencies[Field.CURRENCY_B]}
            size={30}
            margin={true}
          /> */}
        <BorderVerticalContainer>
          <Flex justifyContent={'space-between'} alignItems="center">
            <CurrencyLogo currency={currencies[Field.CURRENCY_A]} size={'36px'} />
            <Flex flexDirection={'column'} justifyContent="space-between" padding="0 16px">
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  fontSize: '.6rem',
                  lineHeight: '.8rem',
                  color: '#FFFFFF'
                }}
              >
                {currencies[Field.CURRENCY_A]?.symbol}
              </Text>
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  fontSize: '.4rem',
                  lineHeight: '.6rem',
                  color: '#CCCCCC'
                }}
              >
                {currencies[Field.CURRENCY_A]?.name}
              </Text>
            </Flex>
            <Text
              sx={{
                flex: 1,
                textAlign: 'right',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.6rem',
                lineHeight: '.8rem',
                color: '#FFFFFF'
              }}
            >
              {parsedAmounts[Field.CURRENCY_A]?.toSignificant(4)}
            </Text>
          </Flex>
          <Flex justifyContent={'space-between'} alignItems="center">
            <CurrencyLogo currency={currencies[Field.CURRENCY_B]} size={'36px'} />
            <Flex flexDirection={'column'} justifyContent="space-between" padding="0 16px">
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '600',
                  fontSize: '.6rem',
                  lineHeight: '.8rem',
                  color: '#FFFFFF'
                }}
              >
                {currencies[Field.CURRENCY_B]?.symbol}
              </Text>
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '400',
                  fontSize: '.4rem',
                  lineHeight: '.6rem',
                  color: '#CCCCCC'
                }}
              >
                {currencies[Field.CURRENCY_B]?.name}
              </Text>
            </Flex>
            <Text
              sx={{
                flex: 1,
                textAlign: 'right',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.6rem',
                lineHeight: '.8rem',
                color: '#FFFFFF'
              }}
            >
              {parsedAmounts[Field.CURRENCY_B]?.toSignificant(4)}
            </Text>
          </Flex>
          <Box
            sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', height: '0', margin: '24px 0' }}
          ></Box>
          <Flex justifyContent={'space-between'} alignItems="center">
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.5rem',
                lineHeight: '.8rem',
                textAlign: 'center',
                color: '#999999'
              }}
            >
              Trading fee
            </Text>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.5rem',
                lineHeight: '.8rem',
                textAlign: 'center',
                color: '#999999'
              }}
            >
              0.3%
            </Text>
          </Flex>
        </BorderVerticalContainer>
        <BorderVerticalContainer>
          <Flex justifyContent={'space-between'}>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.7rem',
                lineHeight: '.9rem',
                color: '#FFFFFF'
              }}
            >
              Pool Share
            </Text>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.7rem',
                lineHeight: '.9rem',
                color: '#FFFFFF',
                textAlign: 'right'
              }}
            >
              {poolTokenPercentage?.toFixed(2) || 100}%
            </Text>
          </Flex>
        </BorderVerticalContainer>
        <BorderVerticalContainer>
          <Flex justifyContent={'space-between'}>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: '500',
                fontSize: '.7rem',
                lineHeight: '.9rem',
                color: '#FFFFFF'
              }}
            >
              Price
            </Text>
            <Flex flexDirection="column" textAlign={'right'}>
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: '.5rem',
                  lineHeight: '.8rem',
                  color: '#FFFFFF'
                }}
              >
                {price?.toFixed(2)}
              </Text>
              <Text
                sx={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: '500',
                  fontSize: '.4rem',
                  lineHeight: '.6rem',
                  color: '#999999'
                }}
              >
                {currencies[Field.CURRENCY_A]?.symbol} to {currencies[Field.CURRENCY_B]?.symbol}
              </Text>
            </Flex>
          </Flex>
        </BorderVerticalContainer>
        <ButtonPrimary style={{ margin: '20px 0 0 0', color: 'black' }} onClick={onAdd}>
          <Text
            sx={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: '500',
              fontSize: '.8rem',
              lineHeight: '1rem',
              textAlign: 'center',
              color: '#05050E'
            }}
          >
            {pairState === PairState.NOT_EXISTS ? 'Add Liquidity' : pairState === PairState.EXISTS ? 'Increase' : ''}
          </Text>
        </ButtonPrimary>
      </Flex>
    )
  }, [currencies, onAdd, pairState, parsedAmounts, poolTokenPercentage, price])

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const addIsUnsupported = useIsTransactionUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  return (
    <>
      <Flex alignItems={'flex-start'} width="21rem">
        <BackToMyLiquidity />
      </Flex>
      <AppBody
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: '1.2rem .9rem',
          width: '21rem'
          // maxWidth: '420px',
          // maxHeight: '638px',
          // height: 'fit-content',
        }}
      >
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              // title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
              title={'Add Liquidity'}
              onDismiss={handleDismissConfirmation}
              topContent={modalHeader}
              bottomContent={undefined}
            />
          )}
          pendingText={pendingText}
          currencyToAdd={pair?.liquidityToken}
        />
        <AutoRow justify="space-between" style={{ marginBottom: '.9rem' }}>
          <span style={{ fontFamily: 'Dela Gothic One', fontWeight: 400, fontSize: '0.7rem', color: '#FFFFFF' }}>
            Add Liquidity
          </span>
          <Settings />
        </AutoRow>
        <AutoColumn gap=".4rem">
          {/* {noLiquidity ||
              (isCreate ? (
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
              ) : (
                <ColumnCenter>
                  <BlueCard>
                    <AutoColumn gap="10px">
                      <TYPE.link fontWeight={400} color={'primaryText1'}>
                        <b>Tip:</b> When you add liquidity, you will receive pool tokens representing your position.
                        These tokens automatically earn fees proportional to your share of the pool, and can be redeemed
                        at any time.
                      </TYPE.link>
                    </AutoColumn>
                  </BlueCard>
                </ColumnCenter>
              ))} */}
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_A]}
            onUserInput={onFieldAInput}
            onMax={() => {
              onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
            }}
            onCurrencySelect={handleCurrencyASelect}
            showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
            currency={currencies[Field.CURRENCY_A]}
            id="add-liquidity-input-tokena"
            sx={{
              '& input': {
                color: 'white'
              }
            }}
            showCommonBases
          />
          <ColumnCenter style={{ position: 'relative' }}>
            {/* <Plus size="16" color={theme.text2} /> */}
            <img
              src={AddIcon}
              alt={'add-icon'}
              style={{ position: 'absolute', transform: 'translateY(-50%)', width: '56px', height: '56px' }}
            />
          </ColumnCenter>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            onUserInput={onFieldBInput}
            onCurrencySelect={handleCurrencyBSelect}
            onMax={() => {
              onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
            }}
            showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
            currency={currencies[Field.CURRENCY_B]}
            id="add-liquidity-input-tokenb"
            sx={{
              '& input': {
                color: 'white'
              }
            }}
            showCommonBases
          />
          {/*   {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
            <>
              <LightCard padding="0px" borderRadius={'20px'}>
                <RowBetween padding="1rem">
                  <TYPE.subHeader fontWeight={500} fontSize={14}>
                    {noLiquidity ? 'Initial prices' : 'Prices'} and pool share
                  </TYPE.subHeader>
                </RowBetween>{' '}
                <LightCard padding="1rem" borderRadius={'20px'}>
                  <PoolPriceBar
                    currencies={currencies}
                    poolTokenPercentage={poolTokenPercentage}
                    noLiquidity={noLiquidity}
                    price={price}
                  />
                </LightCard>
              </LightCard>
            </>
          )} */}
        </AutoColumn>
        <Box sx={{ marginTop: '.9rem' }}>
          <Box sx={{ fontWeight: 600, fontSize: '1rem', marginBottom: '.5rem' }}>Pair Mode</Box>
          <Box sx={{ display: 'flex', fontWeight: 400, fontSize: '.5rem', alignItems: 'center' }}>
            <Flex alignItems={'center'} sx={{ flex: 1 }} onClick={() => setPairModeStable(false)}>
              <CustomizedRadio type="radio" name="pairMode" id="Volatile" checked={!pairModeStable} />
              <label style={{ fontSize: '0.7rem', margin: '0 0 0 .7rem' }} htmlFor="Volatile">
                Volatile
              </label>
              <QuestionHelper text="Volatile mode, using non-stable currency algorithm curve, mainly designed for uncorrelated pools, like WETH+USDC or OP+WETH." />
            </Flex>
            <Flex alignItems={'center'} sx={{ flex: 1 }} onClick={() => setPairModeStable(true)}>
              <CustomizedRadio type="radio" name="pairMode" id="Stable" checked={pairModeStable} />
              <label htmlFor="Stable" style={{ fontSize: '0.7rem', margin: '0 0 0 .7rem' }}>
                Stable
              </label>
              <QuestionHelper text="Stable mode, using stable token algorithm curve, mainly designed for 1:1 or approximately equivalent trading pairs, like USDC+DAI or WETH+sETH." />
            </Flex>
          </Box>
        </Box>
        <Box sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', height: '0', margin: '.9rem 0' }}></Box>

        <Box
          sx={{
            marginBottom: '.5rem',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: '28px'
          }}
        >
          Pair Liquidity Info
        </Box>
        <Flex width={'100%'} justifyContent="space-between">
          <Flex flex={1} flexDirection={'column'}>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '0.8rem',
                lineHeight: '24px'
              }}
            >
              {/* {new bn(v2Pair.trackedReserveETH).decimalPlaces(4, bn.ROUND_HALF_UP).toString()} */}
              {pair && new bn(pair?.reserve0.toExact()).decimalPlaces(4, bn.ROUND_HALF_UP).toString()}
            </Text>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '0.8rem',
                lineHeight: '18px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {pair?.token0.symbol?.toUpperCase()}
            </Text>
          </Flex>
          <Flex flex={1} flexDirection={'column'}>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '0.8rem',
                lineHeight: '24px'
              }}
            >
              {pair && new bn(pair?.reserve1.toExact()).decimalPlaces(4, bn.ROUND_HALF_UP).toString()}
            </Text>
            <Text
              sx={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '0.8rem',
                lineHeight: '18px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {pair?.token1.symbol?.toUpperCase()}
            </Text>
          </Flex>
        </Flex>
        {/*  <Box sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', height: '0', margin: '.9rem 0' }}></Box>
        {!addIsUnsupported ? (
          pair && !noLiquidity && pairState !== PairState.INVALID ? (
            <AutoColumn style={{ marginTop: '1rem' }}>
              <MinimalPositionCardPart showUnwrapped={oneCurrencyIsWETH} pair={pair} />
            </AutoColumn>
          ) : null
        ) : (
          <UnsupportedCurrencyFooter
            show={addIsUnsupported}
            currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
          />
        )}
        <Text
          sx={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '400',
            fontSize: '.4rem',
            // lineHeight: '18px',
            margin: '.9rem 0',
            color: '#D7DCE0'
          }}
        >
          By adding liquidity to this pair,you’ll earn 0.3% of all the trades on this pair proportional to your share of
          the pool. And earnings will be claimed while removing your liquidity.
        </Text>
        <Box sx={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', height: '0' }}></Box> */}
        <Box
          sx={{
            button: {
              maxHeight: '3rem'
            }
          }}
        >
          {addIsUnsupported ? (
            <AutoColumn style={{ marginTop: '1rem' }}>
              <ButtonPrimary disabled={true}>
                <TYPE.main mb="4px">Unsupported Asset</TYPE.main>
              </ButtonPrimary>
            </AutoColumn>
          ) : !account ? (
            <AutoColumn style={{ marginTop: '1rem' }}>
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            </AutoColumn>
          ) : (
            <AutoColumn style={{ marginTop: '1rem' }}>
              {(approvalA === ApprovalState.NOT_APPROVED ||
                approvalA === ApprovalState.PENDING ||
                approvalB === ApprovalState.NOT_APPROVED ||
                approvalB === ApprovalState.PENDING) &&
                isValid && (
                  <RowBetween>
                    {approvalA !== ApprovalState.APPROVED && (
                      <ButtonPrimary
                        style={{
                          marginBottom: '0.5rem'
                        }}
                        onClick={approveACallback}
                        disabled={approvalA === ApprovalState.PENDING}
                        width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                      >
                        {approvalA === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                        ) : (
                          'Approve ' + currencies[Field.CURRENCY_A]?.symbol
                        )}
                      </ButtonPrimary>
                    )}
                    {approvalB !== ApprovalState.APPROVED && (
                      <ButtonPrimary
                        style={{
                          marginBottom: '0.5rem'
                        }}
                        onClick={approveBCallback}
                        disabled={approvalB === ApprovalState.PENDING}
                        width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                      >
                        {approvalB === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                        ) : (
                          'Approve ' + currencies[Field.CURRENCY_B]?.symbol
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
                error={!!error || (!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B])}
              >
                <Text fontSize={20} fontWeight={500}>
                  {error ?? 'Supply'}
                </Text>
              </ButtonError>
            </AutoColumn>
          )}
          {/* {!addIsUnsupported ? (
          pair && !noLiquidity && pairState !== PairState.INVALID ? (
            <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '420px', marginTop: '1rem' }}>
              <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
            </AutoColumn>
          ) : null
        ) : (
            <UnsupportedCurrencyFooter
              show={addIsUnsupported}
              currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
            />
          )} */}
        </Box>
      </AppBody>
      <Box
        sx={{
          background: 'rgba(51, 51, 51, 0.3)',
          transform: 'translateY(-3rem)',
          zIndex: -1,
          maxWidth: '21rem',
          position: 'relative',
          width: '21rem',
          padding: '1.2rem .9rem',
          paddingTop: '4rem',
          borderRadius: '1.6rem',
          backdropFilter: 'blur(36.9183px)'
        }}
      >
        By adding liquidity to this pair,you’ll earn 0.3% of all the trades on this pair proportional to your share of
        the pool. And earnings will be claimed while removing your liquidity. 0.044663 ETH 0.30% minimum received
        slippage tolerance
      </Box>
    </>
  )
}

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
`
