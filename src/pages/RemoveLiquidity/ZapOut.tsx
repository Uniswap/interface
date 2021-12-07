import React, { useCallback, useContext, useMemo, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Flex, Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'

import {
  computePriceImpact,
  Currency,
  CurrencyAmount,
  currencyEquals,
  ETHER,
  Percent,
  Token,
  TokenAmount,
  WETH
} from '@dynamic-amm/sdk'
import { ZAP_ADDRESSES } from 'constants/index'
import { ButtonPrimary, ButtonLight, ButtonError, ButtonConfirmed } from 'components/Button'
import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import Loader from 'components/Loader'
import { Dots } from 'components/swap/styleds'
import Slider from 'components/Slider'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedPriceImpact from 'components/swap/FormattedPriceImpact'
import ZapError from 'components/ZapError'
import CurrentPrice from 'components/CurrentPrice'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { usePairContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useApproveCallback, ApprovalState } from 'hooks/useApproveCallback'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useZapOutActionHandlers } from 'state/burn/hooks'
import { useDerivedZapOutInfo, useBurnState } from 'state/burn/hooks'
import { Field } from 'state/burn/actions'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, TYPE, UppercaseText } from 'theme'
import { Wrapper } from '../Pool/styleds'
import { calculateGasMargin, formattedNum, getZapContract } from 'utils'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { currencyId } from 'utils/currencyId'
import { formatJSBIValue } from 'utils/formatBalance'
import { computePriceImpactWithoutFee, warningSeverity } from 'utils/prices'
import {
  SecondColumn,
  GridColumn,
  MaxButton,
  FirstColumn,
  DetailWrapper,
  DetailBox,
  TokenWrapper,
  ModalDetailWrapper,
  CurrentPriceWrapper
} from './styled'

export default function ZapOut({
  currencyIdA,
  currencyIdB,
  pairAddress
}: {
  currencyIdA: string
  currencyIdB: string
  pairAddress: string
}) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()

  const nativeA = useCurrencyConvertedToNative(currencyA as Currency)
  const nativeB = useCurrencyConvertedToNative(currencyB as Currency)
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    currencyA,
    currencyB,
    chainId
  ])

  const theme = useContext(ThemeContext)

  const expertMode = useIsExpertMode()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, independentTokenField, typedValue } = useBurnState()
  const {
    dependentTokenField,
    currencies,
    pair,
    userLiquidity,
    noZapAmounts,
    parsedAmounts,
    amountsMin,
    insufficientLiquidity,
    price,
    error
  } = useDerivedZapOutInfo(currencyA ?? undefined, currencyB ?? undefined, pairAddress)
  const { onUserInput: _onUserInput, onSwitchField } = useZapOutActionHandlers()

  const selectedCurrencyIsETHER = !!(
    chainId &&
    currencies[independentTokenField] &&
    currencyEquals(currencies[independentTokenField] as Currency, ETHER)
  )

  const selectedCurrencyIsWETH = !!(
    chainId &&
    currencies[independentTokenField] &&
    currencyEquals(currencies[independentTokenField] as Currency, WETH[chainId])
  )

  const independentToken =
    nativeA && nativeB ? (independentTokenField === Field.CURRENCY_A ? nativeA : nativeB) : undefined

  const isValid = !error && !insufficientLiquidity

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const [zapOutError, setZapOutError] = useState<string>('')

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

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(
    parsedAmounts[Field.LIQUIDITY],
    !!chainId ? ZAP_ADDRESSES[chainId] : undefined
  )

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!chainId) throw new Error('missing chain')
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
      name: 'KyberDMM LP',
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
      spender: ZAP_ADDRESSES[chainId],
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
  const onCurrencyInput = useCallback((typedValue: string): void => onUserInput(independentTokenField, typedValue), [
    independentTokenField,
    onUserInput
  ])

  // tx sending
  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const router = getZapContract(chainId, library, account)

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB === ETHER

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // zapOutEth
      if (selectedCurrencyIsETHER) {
        methodNames = ['zapOutEth']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          pairAddress,
          account,
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          deadline.toHexString()
        ]
      }
      // zapOut
      else {
        methodNames = ['zapOut']
        args = [
          independentTokenField === Field.CURRENCY_A ? tokenB.address : tokenA.address,
          independentTokenField === Field.CURRENCY_A ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          pairAddress,
          account,
          independentTokenField === Field.CURRENCY_A
            ? amountsMin[Field.CURRENCY_A].toString()
            : amountsMin[Field.CURRENCY_B].toString(),
          deadline.toHexString()
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // zapOutEthPermit
      if (selectedCurrencyIsETHER) {
        methodNames = ['zapOutEthPermit']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          pairAddress,
          account,
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s
        ]
      }
      // zapOutPermit
      else {
        methodNames = ['zapOutPermit']
        args = [
          independentTokenField === Field.CURRENCY_A ? tokenB.address : tokenA.address,
          independentTokenField === Field.CURRENCY_A ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          pairAddress,
          account,
          independentTokenField === Field.CURRENCY_A
            ? amountsMin[Field.CURRENCY_A].toString()
            : amountsMin[Field.CURRENCY_B].toString(),
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
          .then(calculateGasMargin)
          .catch(err => {
            // we only care if the error is something other than the user rejected the tx
            if ((err as any)?.code !== 4001) {
              console.error(`estimateGas failed`, methodName, args, err)
            }

            if (err.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
              setZapOutError(t`Insufficient liquidity available. Please reload page and try again!`)
            } else {
              setZapOutError(err?.message)
            }

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
          if (!!currencyA && !!currencyB) {
            setAttemptingTxn(false)

            addTransaction(response, {
              summary:
                'Remove ' + parsedAmounts[independentTokenField]?.toSignificant(3) + ' ' + independentToken?.symbol
            })

            setTxHash(response.hash)
          }
        })
        .catch((err: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if ((err as any)?.code !== 4001) {
            console.error(err)
          }

          if (err.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
            setZapOutError(t`Insufficient liquidity available. Please reload page and try again`)
          } else {
            setZapOutError(err?.message)
          }
        })
    }
  }

  const pendingText = `Removing ${parsedAmounts[independentTokenField]?.toSignificant(6)} ${independentToken?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
    setZapOutError('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  )

  const handleSwitchCurrency = useCallback(() => {
    onSwitchField()
  }, [onSwitchField])

  const priceToSwap = price ? (independentTokenField === Field.CURRENCY_A ? price.invert() : price) : undefined

  const amountOut =
    parsedAmounts[independentTokenField] &&
    noZapAmounts[independentTokenField] &&
    !(parsedAmounts[independentTokenField] as TokenAmount).lessThan(noZapAmounts[independentTokenField] as TokenAmount)
      ? (parsedAmounts[independentTokenField] as TokenAmount).subtract(
          noZapAmounts[independentTokenField] as TokenAmount
        )
      : undefined

  const usdPrices = useTokensPrice([tokenA, tokenB])

  const estimatedUsd =
    parsedAmounts[independentTokenField] && usdPrices[0]
      ? parseFloat((parsedAmounts[independentTokenField] as TokenAmount).toSignificant(6)) * usdPrices[0]
      : 0

  const priceImpact =
    priceToSwap &&
    noZapAmounts[dependentTokenField] &&
    amountOut &&
    computePriceImpact(priceToSwap, noZapAmounts[dependentTokenField] as CurrencyAmount, amountOut as CurrencyAmount)

  const priceImpactWithoutFee = pair && priceImpact ? computePriceImpactWithoutFee([pair], priceImpact) : undefined

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <AutoRow gap="4px">
          <CurrencyLogo currency={currencies[independentTokenField]} size={'24px'} />
          <Text fontSize={24} fontWeight={500}>
            {parsedAmounts[independentTokenField]?.toSignificant(6)}
          </Text>
          <Text fontSize={24} fontWeight={500}>
            {independentToken?.symbol}
          </Text>
          {estimatedUsd && (
            <Text color={theme.subText} marginLeft="4px" fontSize={18} fontWeight={500}>
              (~{formattedNum(estimatedUsd.toString(), true) || undefined})
            </Text>
          )}
        </AutoRow>

        <TYPE.italic fontSize={12} fontWeight={400} color={theme.subText} textAlign="left">
          {t`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <ModalDetailWrapper>
          {pair && (
            <>
              <CurrentPriceWrapper style={{ paddingBottom: '8px' }}>
                <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
                  <Trans>Current Price</Trans>
                </TYPE.subHeader>
                <TYPE.black fontSize={14} fontWeight={400}>
                  <CurrentPrice price={price} />
                </TYPE.black>
              </CurrentPriceWrapper>

              <RowBetween style={{ paddingBottom: '12px' }}>
                <TYPE.subHeader fontSize={14} fontWeight={400} color={theme.subText}>
                  <Trans>Price Impact</Trans>
                </TYPE.subHeader>
                <TYPE.black fontSize={14} fontWeight={400}>
                  <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                </TYPE.black>
              </RowBetween>

              <RowBetween style={{ paddingBottom: '12px' }}>
                <Text color={theme.subText} fontSize={14} fontWeight={400}>
                  <Trans>LP Tokens Removed</Trans>
                </Text>

                <RowFixed>
                  <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
                  <Text color={theme.text} fontSize={14} fontWeight={400}>
                    {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
                  </Text>
                </RowFixed>
              </RowBetween>

              {amountsMin && (
                <>
                  <RowBetween style={{ paddingBottom: '12px' }}>
                    <TYPE.subHeader fontWeight={400} fontSize={14} color={theme.subText}>
                      <Trans>Minimum received</Trans>
                    </TYPE.subHeader>

                    <TokenWrapper>
                      <CurrencyLogo currency={independentToken} size="16px" />
                      <TYPE.black fontWeight={400} fontSize={14}>
                        {formatJSBIValue(
                          independentTokenField === Field.CURRENCY_A
                            ? amountsMin[Field.CURRENCY_A]
                            : amountsMin[Field.CURRENCY_B],
                          independentToken?.decimals
                        )}{' '}
                        {independentToken?.symbol}
                      </TYPE.black>
                    </TokenWrapper>
                  </RowBetween>
                </>
              )}
            </>
          )}
        </ModalDetailWrapper>

        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Confirm</Trans>
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  return (
    <>
      <Wrapper>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash ? txHash : ''}
          content={() =>
            zapOutError ? (
              <TransactionErrorContent onDismiss={handleDismissConfirmation} message={zapOutError} />
            ) : (
              <ConfirmationModalContent
                title={'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )
          }
          pendingText={pendingText}
        />
        <AutoColumn gap="md">
          <GridColumn>
            <FirstColumn>
              <BlackCard padding="1rem" borderRadius="4px">
                <AutoColumn gap="1rem">
                  <RowBetween>
                    <Text fontSize={12} fontWeight={500}>
                      <Trans>Amount</Trans>
                    </Text>

                    <Text fontSize={12} fontWeight={500}>
                      <Trans>Balance</Trans>: {!userLiquidity ? <Loader /> : userLiquidity?.toSignificant(6)} LP Tokens
                    </Text>
                  </RowBetween>
                  <Row style={{ alignItems: 'flex-end' }}>
                    <Text fontSize={72} fontWeight={500}>
                      {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                    </Text>
                  </Row>

                  <>
                    <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} size={18} />
                    <RowBetween>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')} width="20%">
                        25%
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')} width="20%">
                        50%
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')} width="20%">
                        75%
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')} width="20%">
                        <Trans>Max</Trans>
                      </MaxButton>
                    </RowBetween>
                  </>
                </AutoColumn>
              </BlackCard>

              {chainId && pair && (
                <CurrencyInputPanel
                  hideBalance
                  hideLogo
                  value={formattedAmounts[Field.LIQUIDITY]}
                  onUserInput={onLiquidityInput}
                  showMaxButton={false}
                  disableCurrencySelect
                  currency={
                    new Token(
                      chainId,
                      pair.liquidityToken?.address,
                      pair.liquidityToken?.decimals,
                      `LP Tokens`,
                      `LP Tokens`
                    )
                  }
                  id="liquidity-amount"
                />
              )}
            </FirstColumn>

            <SecondColumn>
              <div>
                <CurrencyInputPanel
                  disabledInput
                  value={formattedAmounts[independentTokenField]}
                  onUserInput={onCurrencyInput}
                  onSwitchCurrency={handleSwitchCurrency}
                  showMaxButton={false}
                  currency={currencies[independentTokenField]}
                  id="zap-out-input"
                  label={t`Output`}
                  disableCurrencySelect={false}
                  showCommonBases
                  positionMax="top"
                  isSwitchMode
                  estimatedUsd={formattedNum(estimatedUsd.toString(), true) || undefined}
                />
                <Flex justifyContent="flex-end" alignItems="center" marginTop="0.5rem">
                  {pairAddress &&
                    chainId &&
                    (selectedCurrencyIsETHER || selectedCurrencyIsWETH) &&
                    currencies[dependentTokenField] && (
                      <StyledInternalLink
                        replace
                        to={
                          independentTokenField === Field.CURRENCY_A
                            ? `/remove/${
                                selectedCurrencyIsETHER
                                  ? currencyId(WETH[chainId], chainId)
                                  : currencyId(ETHER, chainId)
                              }/${currencyId(currencies[dependentTokenField] as Currency, chainId)}/${pairAddress}`
                            : `/remove/${currencyId(currencies[dependentTokenField] as Currency, chainId)}/${
                                selectedCurrencyIsETHER
                                  ? currencyId(WETH[chainId], chainId)
                                  : currencyId(ETHER, chainId)
                              }/${pairAddress}`
                        }
                      >
                        {selectedCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                </Flex>
              </div>

              {pair && (
                <DetailWrapper>
                  <DetailBox style={{ paddingBottom: '12px', borderBottom: `1px dashed ${theme.border}` }}>
                    <AutoColumn gap="8px">
                      <TYPE.subHeader fontWeight={500} fontSize={12} color={theme.subText}>
                        <UppercaseText>
                          <Trans>Price Impact</Trans>
                        </UppercaseText>
                      </TYPE.subHeader>
                      <TYPE.black fontWeight={400} fontSize={14}>
                        <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                      </TYPE.black>
                    </AutoColumn>

                    {amountsMin && (
                      <AutoColumn gap="8px">
                        <TYPE.subHeader fontWeight={500} fontSize={12} color={theme.subText}>
                          <UppercaseText>
                            <Trans>Minimum received</Trans>
                          </UppercaseText>
                        </TYPE.subHeader>

                        <TokenWrapper>
                          <CurrencyLogo
                            currency={independentTokenField === Field.CURRENCY_A ? currencyA : currencyB}
                            size="16px"
                          />
                          <TYPE.black fontWeight={400} fontSize={14}>
                            {formatJSBIValue(
                              independentTokenField === Field.CURRENCY_A
                                ? amountsMin[Field.CURRENCY_A]
                                : amountsMin[Field.CURRENCY_B],
                              independentToken?.decimals
                            )}{' '}
                            {independentToken?.symbol}
                          </TYPE.black>
                        </TokenWrapper>
                      </AutoColumn>
                    )}
                  </DetailBox>

                  <DetailBox style={{ paddingTop: '12px' }}>
                    <TYPE.subHeader
                      fontWeight={500}
                      fontSize={12}
                      color={theme.subText}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <UppercaseText>
                        <Trans>Current Price:</Trans>
                      </UppercaseText>
                    </TYPE.subHeader>
                    <TYPE.black fontWeight={400} fontSize={14}>
                      <CurrentPrice price={price} />
                    </TYPE.black>
                  </DetailBox>
                </DetailWrapper>
              )}

              {insufficientLiquidity ? (
                <ZapError message={t`Insufficient Liquidity in the Liquidity Pool to Swap`} warning={false} />
              ) : priceImpactSeverity > 3 ? (
                <ZapError message={t`Price impact is too high`} warning={false} />
              ) : priceImpactSeverity > 2 ? (
                <ZapError message={t`Price impact is high`} warning={true} />
              ) : null}

              <div style={{ position: 'relative' }}>
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : (
                  <RowBetween>
                    <ButtonConfirmed
                      onClick={onAttemptToApprove}
                      confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                      disabled={
                        !isValid ||
                        approval !== ApprovalState.NOT_APPROVED ||
                        signatureData !== null ||
                        !userLiquidity ||
                        userLiquidity.equalTo('0') ||
                        (priceImpactSeverity > 3 && !expertMode)
                      }
                      margin="0 1rem 0 0"
                      fontWeight={500}
                      fontSize={16}
                      padding="16px"
                    >
                      {approval === ApprovalState.PENDING ? (
                        <Dots>
                          <Trans>Approving</Trans>
                        </Dots>
                      ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                        t`Approved`
                      ) : (
                        t`Approve`
                      )}
                    </ButtonConfirmed>
                    <ButtonError
                      padding="16px 6px"
                      onClick={() => {
                        setShowConfirm(true)
                      }}
                      disabled={
                        !isValid ||
                        (signatureData === null && approval !== ApprovalState.APPROVED) ||
                        (priceImpactSeverity > 3 && !expertMode)
                      }
                      error={
                        !!parsedAmounts[Field.CURRENCY_A] &&
                        !!parsedAmounts[Field.CURRENCY_B] &&
                        (!isValid || priceImpactSeverity > 2)
                      }
                    >
                      <Text fontSize={16} fontWeight={500}>
                        {error
                          ? error
                          : priceImpactSeverity > 3 && !expertMode
                          ? t`Remove`
                          : priceImpactSeverity > 2
                          ? t`Remove Anyway`
                          : t`Remove`}
                      </Text>
                    </ButtonError>
                  </RowBetween>
                )}
              </div>
            </SecondColumn>
          </GridColumn>
        </AutoColumn>
      </Wrapper>
    </>
  )
}
