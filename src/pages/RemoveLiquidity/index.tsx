import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, Percent, CurrencyAmount, JSBI, ChainId, RoutablePlatform } from '@swapr/sdk'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { ArrowDown, Plus, Repeat } from 'react-feather'
import { RouteComponentProps } from 'react-router'
import { Box, Flex, Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { ButtonPrimary, ButtonError, ButtonConfirmed } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFixed } from '../../components/Row'
import TradePrice from '../../components/swap/TradePrice'

import Slider from '../../components/Slider'
import CurrencyLogo from '../../components/CurrencyLogo'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { usePairContract, useWrappingToken } from '../../hooks/useContract'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { Wrapper } from '../Pools/styleds'
import { Option } from '../../components/Option'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { Dots } from '../../components/swap/styleds'
import { useBurnActionHandlers } from '../../state/burn/hooks'
import { useDerivedBurnInfo, useBurnState } from '../../state/burn/hooks'
import { Field } from '../../state/burn/actions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { calculateProtocolFee } from '../../utils/prices'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'

const StyledInternalLinkText = styled(TYPE.body)`
  display: flex;
  text-transform: uppercase;
  text-decoration: underline;
`

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyWrapper = useWrappingToken(nativeCurrency)
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    currencyA,
    currencyB,
    chainId
  ])

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showDetailed /* setShowDetailed */] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  const [showInverted, setShowInverted] = useState<boolean>(false)

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
  }

  const { protocolFee } = calculateProtocolFee(
    pair,
    chainId && currencyA === nativeCurrency && parsedAmounts[Field.CURRENCY_A]
      ? CurrencyAmount.nativeCurrency(parsedAmounts[Field.CURRENCY_A]?.raw ?? '', chainId)
      : parsedAmounts[Field.CURRENCY_A]
  )
  const swapFee = pair ? new Percent(JSBI.BigInt(pair.swapFee.toString()), JSBI.BigInt(10000)) : undefined

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const routerAddress = RoutablePlatform.SWAPR.routerAddress[chainId ? chainId : ChainId.MAINNET]
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], routerAddress)

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      return approveCallback()
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]
    const domain = {
      name: 'DXswap',
      version: '1',
      chainId: chainId,
      verifyingContract: pair.liquidityToken.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
    const message = {
      owner: account,
      spender: routerAddress,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber()
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit
      },
      domain,
      primaryType: 'Permit',
      message
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then(signature => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber()
        })
      })
      .catch(error => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback()
        }
      })
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null)
      return _onUserInput(field, typedValue)
    },
    [_onUserInput]
  )

  const onLiquidityInput = useCallback((typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue), [
    onUserInput
  ])
  const onCurrencyAInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue), [
    onUserInput
  ])
  const onCurrencyBInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue), [
    onUserInput
  ])

  // tx sending
  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !deadline ) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const router = getRouterContract(chainId, library, RoutablePlatform.SWAPR, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0]
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsNative = currencyB === nativeCurrency
    const oneCurrencyIsNative = currencyA === nativeCurrency || currencyBIsNative

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsNative) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          currencyBIsNative ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsNative ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsNative ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString()
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadline.toHexString()
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsNative) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          currencyBIsNative ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsNative ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsNative ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map(methodName =>
        router.estimateGas[methodName](...args)
          .then(estimatedGas => calculateGasMargin(estimatedGas))
          .catch(error => {
            console.error(`estimateGas failed`, methodName, args, error)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Remove ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencyA?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencyB?.symbol
          })

          setTxHash(response.hash)
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.text2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color={theme.text2} fontWeight={500} fontSize={16}>
            {'DXS ' + currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo marginRight={6} currency0={currencyA} currency1={currencyB} />
            <Text fontWeight={500} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        {pair && (
          <>
            <RowBetween>
              <Text color={theme.text2} fontWeight={500} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )}
        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <Text fontWeight={500} fontSize={20}>
            Confirm
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencyA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencyB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )

  const oneCurrencyIsNative = (currencyA && Currency.isNative(currencyA)) || (currencyB && Currency.isNative(currencyB))
  const oneCurrencyIsNativeWrapper = Boolean(
    chainId &&
      nativeCurrencyWrapper &&
      ((currencyA && currencyEquals(nativeCurrencyWrapper, currencyA)) ||
        (currencyB && currencyEquals(nativeCurrencyWrapper, currencyB)))
  )

  const handleSelectCurrencyA = useCallback(
    (currency: Currency) => {
      if (currencyIdB && currencyId(currency) === currencyIdB) {
        history.push(`/remove/${currencyId(currency)}/${currencyIdA}`)
      } else {
        history.push(`/remove/${currencyId(currency)}/${currencyIdB}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )
  const handleSelectCurrencyB = useCallback(
    (currency: Currency) => {
      if (currencyIdA && currencyId(currency) === currencyIdA) {
        history.push(`/remove/${currencyIdB}/${currencyId(currency)}`)
      } else {
        history.push(`/remove/${currencyIdA}/${currencyId(currency)}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  )

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={false} adding={false} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            content={() => (
              <ConfirmationModalContent
                title={'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="md">
            <LightCard>
              <AutoColumn gap="12px">
                <RowBetween>
                  <TYPE.body textAlign="center" fontWeight={500} fontSize="16px" lineHeight="19.5px" width="100%">
                    Amount
                  </TYPE.body>
                </RowBetween>
                <Row>
                  <Text textAlign="center" fontSize="62px" lineHeight="76px" fontWeight={500} width="100%">
                    {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                  </Text>
                </Row>
                {!showDetailed && (
                  <>
                    <Flex flexDirection="column" alignItems="center">
                      <Box width="90%" mb="24px">
                        <Slider value={innerLiquidityPercentage} size={16} onChange={setInnerLiquidityPercentage} />
                      </Box>
                      <Flex width="90%" justifyContent="space-around">
                        <Box width="20%">
                          <Option
                            active={formattedAmounts[Field.LIQUIDITY_PERCENT] === '25'}
                            onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}
                          >
                            25%
                          </Option>
                        </Box>
                        <Box width="20%">
                          <Option
                            active={formattedAmounts[Field.LIQUIDITY_PERCENT] === '50'}
                            onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}
                          >
                            50%
                          </Option>
                        </Box>
                        <Box width="20%">
                          <Option
                            active={formattedAmounts[Field.LIQUIDITY_PERCENT] === '75'}
                            onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}
                          >
                            75%
                          </Option>
                        </Box>
                        <Box width="20%">
                          <Option
                            active={formattedAmounts[Field.LIQUIDITY_PERCENT] === '100'}
                            onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                          >
                            Max
                          </Option>
                        </Box>
                      </Flex>
                    </Flex>
                  </>
                )}
              </AutoColumn>
            </LightCard>
            {!showDetailed && (
              <>
                <ColumnCenter>
                  <ArrowDown size="16" color={theme.text2} />
                </ColumnCenter>
                <LightCard>
                  <AutoColumn gap="10px">
                    <RowBetween>
                      <TYPE.white fontSize="22px" lineHeight="27px">
                        {formattedAmounts[Field.CURRENCY_A] || '-'}
                      </TYPE.white>
                      <RowFixed>
                        <CurrencyLogo size="20px" currency={currencyA} style={{ marginRight: '8px' }} />
                        <TYPE.white fontSize="16px" lineHeight="20px" id="remove-liquidity-tokena-symbol">
                          {currencyA?.symbol}
                        </TYPE.white>
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <TYPE.white fontSize="22px" lineHeight="27px">
                        {formattedAmounts[Field.CURRENCY_B] || '-'}
                      </TYPE.white>
                      <RowFixed>
                        <CurrencyLogo size="20px" currency={currencyB} style={{ marginRight: '8px' }} />
                        <TYPE.white fontSize="16px" lineHeight="20px" id="remove-liquidity-tokenb-symbol">
                          {currencyB?.symbol}
                        </TYPE.white>
                      </RowFixed>
                    </RowBetween>
                    {chainId && (oneCurrencyIsNativeWrapper || oneCurrencyIsNative) ? (
                      <RowBetween style={{ justifyContent: 'flex-end' }}>
                        {oneCurrencyIsNative ? (
                          <StyledInternalLink
                            to={`/remove/${
                              currencyA === nativeCurrency ? nativeCurrencyWrapper?.address : currencyIdA
                            }/${currencyB === nativeCurrency ? nativeCurrencyWrapper?.address : currencyIdB}`}
                          >
                            <StyledInternalLinkText
                              letterSpacing="0.08em"
                              fontWeight="500"
                              fontSize="11px"
                              lineHeight="13px"
                            >
                              Receive {nativeCurrencyWrapper?.symbol}
                              <Repeat style={{ marginLeft: '4px' }} size={12} />
                            </StyledInternalLinkText>
                          </StyledInternalLink>
                        ) : oneCurrencyIsNativeWrapper ? (
                          <StyledInternalLink
                            to={`/remove/${
                              currencyA && nativeCurrencyWrapper && currencyEquals(currencyA, nativeCurrencyWrapper)
                                ? nativeCurrency.symbol
                                : currencyIdA
                            }/${
                              currencyB && nativeCurrencyWrapper && currencyEquals(currencyB, nativeCurrencyWrapper)
                                ? nativeCurrency.symbol
                                : currencyIdB
                            }`}
                          >
                            <StyledInternalLinkText
                              letterSpacing="0.08em"
                              fontWeight="500"
                              fontSize="11px"
                              lineHeight="13px"
                            >
                              Receive {nativeCurrency.symbol}
                              <Repeat style={{ marginLeft: '4px' }} size={12} />
                            </StyledInternalLinkText>
                          </StyledInternalLink>
                        ) : null}
                      </RowBetween>
                    ) : null}
                  </AutoColumn>
                </LightCard>
              </>
            )}

            {showDetailed && (
              <>
                <CurrencyInputPanel
                  value={formattedAmounts[Field.LIQUIDITY]}
                  onUserInput={onLiquidityInput}
                  onMax={() => {
                    onUserInput(Field.LIQUIDITY_PERCENT, '100')
                  }}
                  showMaxButton={!atMaxAmount}
                  disableCurrencySelect
                  currency={pair?.liquidityToken}
                  pair={pair}
                  id="liquidity-amount"
                />
                <ColumnCenter>
                  <ArrowDown size="16" color={theme.text2} />
                </ColumnCenter>
                <CurrencyInputPanel
                  hideBalance={true}
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onCurrencyAInput}
                  onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                  showMaxButton={!atMaxAmount}
                  currency={currencyA}
                  label={'Output'}
                  onCurrencySelect={handleSelectCurrencyA}
                  id="remove-liquidity-tokena"
                />
                <ColumnCenter>
                  <Plus size="16" color={theme.text2} />
                </ColumnCenter>
                <CurrencyInputPanel
                  hideBalance={true}
                  value={formattedAmounts[Field.CURRENCY_B]}
                  onUserInput={onCurrencyBInput}
                  onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                  showMaxButton={!atMaxAmount}
                  currency={currencyB}
                  label={'Output'}
                  onCurrencySelect={handleSelectCurrencyB}
                  id="remove-liquidity-tokenb"
                />
              </>
            )}
            {pair && tokenA && (
              <AutoColumn gap="8px" style={{ padding: '.25rem .75rem 0 .75rem' }}>
                <RowBetween align="center">
                  <TYPE.body fontWeight="500" fontSize="12px" lineHeight="15px">
                    Price
                  </TYPE.body>
                  <TradePrice
                    price={pair?.priceOf(tokenA)}
                    showInverted={showInverted}
                    setShowInverted={setShowInverted}
                  />
                </RowBetween>
                <RowBetween align="center">
                  <TYPE.body fontWeight="500" fontSize="12px" lineHeight="15px">
                    Swap fee
                  </TYPE.body>
                  <TYPE.body fontWeight="500" fontSize="12px" lineHeight="15px">
                    {swapFee ? `${swapFee.toSignificant(2)}%` : '-'}
                  </TYPE.body>
                </RowBetween>
                <RowBetween align="center">
                  <TYPE.body fontWeight="500" fontSize="12px" lineHeight="15px">
                    Protocol fee
                  </TYPE.body>
                  <TYPE.body fontWeight="500" fontSize="12px" lineHeight="15px">
                    {protocolFee ? `${protocolFee.toSignificant(2)}%` : '-'}
                  </TYPE.body>
                </RowBetween>
              </AutoColumn>
            )}
            <div style={{ position: 'relative' }}>
              {!account ? (
                <ButtonPrimary onClick={toggleWalletModal}>Connect Wallet</ButtonPrimary>
              ) : (
                <RowBetween>
                  <ButtonConfirmed
                    onClick={onAttemptToApprove}
                    confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                    disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                    mr="0.5rem"
                    fontWeight={500}
                    fontSize={16}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <Dots>Approving</Dots>
                    ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                      'Approved'
                    ) : (
                      'Approve'
                    )}
                  </ButtonConfirmed>
                  <ButtonError
                    onClick={() => {
                      setShowConfirm(true)
                    }}
                    disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                    error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                  >
                    {error || 'Remove'}
                  </ButtonError>
                </RowBetween>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {pair ? (
        <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsNativeWrapper} pair={pair} />
        </AutoColumn>
      ) : null}
    </>
  )
}
