import { BigNumber } from '@ethersproject/bignumber'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Fraction, Percent, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import CurrentPrice from 'components/CurrentPrice'
import Dots from 'components/Dots'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Loader'
import Row, { AutoRow, RowBetween, RowFixed } from 'components/Row'
import Slider from 'components/Slider'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { EIP712Domain } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePairContract } from 'hooks/useContract'
import useIsArgentWallet from 'hooks/useIsArgentWallet'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Wrapper } from 'pages/Pool/styleds'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/burn/actions'
import { useBurnActionHandlers, useBurnState, useDerivedBurnInfo } from 'state/burn/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, TYPE, UppercaseText } from 'theme'
import { calculateGasMargin, calculateSlippageAmount, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { formatJSBIValue } from 'utils/formatBalance'
import {
  getDynamicFeeRouterContract,
  getOldStaticFeeRouterContract,
  getStaticFeeRouterContract,
} from 'utils/getContract'
import { ErrorName } from 'utils/sentry'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'

import {
  CurrentPriceWrapper,
  DetailBox,
  DetailWrapper,
  FirstColumn,
  GridColumn,
  MaxButton,
  ModalDetailWrapper,
  SecondColumn,
  TokenWrapper,
} from './styled'

export default function TokenPair({
  currencyIdA,
  currencyIdB,
  pairAddress,
}: {
  currencyIdA: string
  currencyIdB: string
  pairAddress: string
}) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()

  const nativeA = currencyA as Currency
  const nativeB = currencyB as Currency
  const [tokenA, tokenB] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped], [currencyA, currencyB])

  const currencyAIsETHER = !!currencyA?.isNative
  const currencyAIsWETH = !!currencyA?.equals(WETH[chainId])
  const currencyBIsETHER = !!currencyB?.isNative
  const currencyBIsWETH = !!currencyB?.equals(WETH[chainId])

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, userLiquidity, parsedAmounts, amountsMin, price, error, isStaticFeePair, isOldStaticFeeContract } =
    useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined, pairAddress)
  const contractAddress = isEVM
    ? isStaticFeePair
      ? isOldStaticFeeContract
        ? (networkInfo as EVMNetworkInfo).classic.oldStatic?.router
        : (networkInfo as EVMNetworkInfo).classic.static.router
      : (networkInfo as EVMNetworkInfo).classic.dynamic?.router
    : undefined
  const amp = pair?.amp || JSBI.BigInt(0)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const [removeLiquidityError, setRemoveLiquidityError] = useState<string>('')

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
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], contractAddress)

  // if user liquidity change => remove signature
  useEffect(() => {
    setSignatureData(null)
    // eslint-disable-next-line
  }, [userLiquidity?.toExact()])

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

    const domain = {
      name: isStaticFeePair ? 'KyberSwap LP' : 'KyberDMM LP',
      version: '1',
      chainId: chainId,
      verifyingContract: pair.liquidityToken.address,
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
    const message = {
      owner: account,
      TransactionErrorContent,
      spender: contractAddress,
      value: liquidityAmount.quotient.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber(),
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then(signature => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber(),
        })
      })
      .catch((error: any) => {
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
    [_onUserInput],
  )

  const onLiquidityInput = useCallback(
    (typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue),
    [onUserInput],
  )
  const onCurrencyAInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue),
    [onUserInput],
  )
  const onCurrencyBInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue),
    [onUserInput],
  )

  // tx sending
  const addTransactionWithType = useTransactionAdder()
  async function onRemove() {
    if (!library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const routerContract = isStaticFeePair
      ? isOldStaticFeeContract
        ? getOldStaticFeeRouterContract(chainId, library, account)
        : getStaticFeeRouterContract(chainId, library, account)
      : getDynamicFeeRouterContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB.isNative
    const oneCurrencyIsETH = currencyA.isNative || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          pairAddress,
          liquidityAmount.quotient.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString(),
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          tokenA.address,
          tokenB.address,
          pairAddress,
          liquidityAmount.quotient.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadline.toHexString(),
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          pairAddress,
          liquidityAmount.quotient.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          tokenA.address,
          tokenB.address,
          pairAddress,
          liquidityAmount.quotient.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map(methodName =>
        routerContract.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch(error => {
            console.error(`estimateGas failed`, methodName, args, error)
            const e = new Error('Remove Classic Liquidity Error', { cause: error })
            e.name = ErrorName.RemoveClassicLiquidityError
            captureException(e, { extra: { methodName, args } })

            setRemoveLiquidityError(error?.message || JSON.stringify(error))
            return undefined
          }),
      ),
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
      BigNumber.isBigNumber(safeGasEstimate),
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await routerContract[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          if (!!currencyA && !!currencyB) {
            setAttemptingTxn(false)
            const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? ''
            const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
            const tokenSymbolIn = currencyAIsWETH ? NativeCurrencies[chainId].symbol : currencyA.symbol
            const tokenSymbolOut = currencyBIsWETH ? NativeCurrencies[chainId].symbol : currencyB.symbol
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
              extraInfo: {
                tokenAmountIn,
                tokenAmountOut,
                tokenSymbolIn,
                tokenSymbolOut,
                tokenAddressIn: currencyA.wrapped.address,
                tokenAddressOut: currencyB.wrapped.address,
                contract: pairAddress,
                arbitrary: {
                  poolAddress: pairAddress,
                  token_1: currencyA.symbol,
                  token_2: currencyB.symbol,
                  remove_liquidity_method: 'token pair',
                  amp: new Fraction(amp).divide(JSBI.BigInt(10000)).toSignificant(5),
                },
              },
            })

            setTxHash(response.hash)
          }
        })
        .catch((err: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if ((err as any)?.code !== 4001 && (err as any)?.code !== 'ACTION_REJECTED') {
            const e = new Error('Remove Classic Liquidity Error', { cause: err })
            e.name = ErrorName.RemoveClassicLiquidityError
            captureException(e, { extra: { args } })
          }

          if (err.message.includes('INSUFFICIENT')) {
            setRemoveLiquidityError(
              t`Insufficient liquidity available. Please reload page or increase max slippage and try again!`,
            )
          } else {
            setRemoveLiquidityError(err?.message || JSON.stringify(err))
          }
        })
    }
  }

  const usdPrices = useTokensPrice([tokenA, tokenB])

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[1]
      : 0

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    nativeA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${nativeB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
    setRemoveLiquidityError('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
  )

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <AutoRow gap="4px">
          <CurrencyLogo currency={currencyA} size={'28px'} />
          <Text fontSize={32} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <Text fontSize={32} fontWeight={500}>
            {nativeA?.symbol}
          </Text>
          {!!estimatedUsdCurrencyA && (
            <Text color={theme.subText} marginLeft="4px" fontSize={18} fontWeight={500}>
              (~{formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined})
            </Text>
          )}
        </AutoRow>

        <AutoRow gap="4px">
          <CurrencyLogo currency={currencyB} size={'28px'} />
          <Text fontSize={32} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <Text fontSize={32} fontWeight={500}>
            {nativeB?.symbol}
          </Text>
          {!!estimatedUsdCurrencyB && (
            <Text color={theme.subText} marginLeft="4px" fontSize={18} fontWeight={500}>
              (~{formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined})
            </Text>
          )}
        </AutoRow>

        <TYPE.italic fontSize={12} fontWeight={400} color={theme.subText} textAlign="left">
          {t`Output is estimated. If the price changes by more than ${
            allowedSlippage / 100
          }% your transaction will revert.`}
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
                      <Trans>Minimum Received</Trans>
                    </TYPE.subHeader>

                    <TokenWrapper>
                      <CurrencyLogo currency={currencyA} size="16px" />
                      <TYPE.black fontWeight={400} fontSize={14}>
                        {formatJSBIValue(amountsMin[Field.CURRENCY_A], currencyA?.decimals)} {nativeA?.symbol}
                      </TYPE.black>
                    </TokenWrapper>
                  </RowBetween>

                  <RowBetween>
                    <div />

                    <TokenWrapper>
                      <CurrencyLogo currency={currencyB} size="16px" />
                      <TYPE.black fontWeight={400} fontSize={14}>
                        {formatJSBIValue(amountsMin[Field.CURRENCY_B], currencyB?.decimals)} {nativeB?.symbol}
                      </TYPE.black>
                    </TokenWrapper>
                  </RowBetween>
                </>
              )}
            </>
          )}
        </ModalDetailWrapper>

        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <Text fontWeight={500} fontSize={16}>
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
            removeLiquidityError ? (
              <TransactionErrorContent onDismiss={handleDismissConfirmation} message={removeLiquidityError} />
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
                    <RowBetween style={{ gap: '4px' }}>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>25%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>50%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>75%</MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
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
                  onMax={null}
                  onHalf={null}
                  disableCurrencySelect
                  currency={
                    new Token(
                      chainId,
                      pair.liquidityToken?.address,
                      pair.liquidityToken?.decimals,
                      `LP Tokens`,
                      `LP Tokens`,
                    )
                  }
                  id="liquidity-amount"
                />
              )}
            </FirstColumn>

            <SecondColumn>
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onCurrencyAInput}
                    onMax={null}
                    onHalf={null}
                    currency={currencyA}
                    label={t`Output`}
                    onCurrencySelect={() => null}
                    disableCurrencySelect={true}
                    id="remove-liquidity-tokena"
                    estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                  />
                  <Flex justifyContent="flex-end" alignItems="center" marginTop="0.5rem">
                    {pairAddress && chainId && (currencyAIsETHER || currencyAIsWETH) && (
                      <StyledInternalLink
                        replace
                        to={`/remove/${
                          currencyAIsETHER ? currencyId(WETH[chainId], chainId) : NativeCurrencies[chainId].symbol
                        }/${currencyIdB}/${pairAddress}`}
                      >
                        {currencyAIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                  </Flex>
                </div>

                <div>
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onCurrencyBInput}
                    onMax={null}
                    onHalf={null}
                    currency={currencyB}
                    onCurrencySelect={() => null}
                    disableCurrencySelect={true}
                    id="remove-liquidity-tokenb"
                    estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                  />
                  <Flex justifyContent="flex-end" alignItems="center" marginTop="0.5rem">
                    {pairAddress && chainId && (currencyBIsWETH || currencyBIsETHER) && (
                      <StyledInternalLink
                        replace
                        to={`/remove/${currencyIdA}/${
                          currencyBIsETHER ? currencyId(WETH[chainId], chainId) : NativeCurrencies[chainId].symbol
                        }/${pairAddress}`}
                      >
                        {currencyBIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    )}
                  </Flex>
                </div>
              </>

              {pair && (
                <DetailWrapper>
                  <AutoRow justify="space-between" gap="4px" style={{ paddingBottom: '12px' }}>
                    <TYPE.subHeader fontWeight={500} fontSize={12} color={theme.subText}>
                      <UppercaseText>
                        <Trans>Minimum Received</Trans>
                      </UppercaseText>
                    </TYPE.subHeader>
                  </AutoRow>

                  {amountsMin && (
                    <DetailBox style={{ paddingBottom: '12px', borderBottom: `1px dashed ${theme.border}` }}>
                      <TokenWrapper>
                        <CurrencyLogo currency={currencyA} size="16px" />
                        <TYPE.black fontWeight={400} fontSize={14}>
                          {formatJSBIValue(amountsMin[Field.CURRENCY_A], currencyA?.decimals)} {nativeA?.symbol}
                        </TYPE.black>
                      </TokenWrapper>

                      <TokenWrapper>
                        <CurrencyLogo currency={currencyB} size="16px" />
                        <TYPE.black fontWeight={400} fontSize={14}>
                          {formatJSBIValue(amountsMin[Field.CURRENCY_B], currencyB?.decimals)} {nativeB?.symbol}
                        </TYPE.black>
                      </TokenWrapper>
                    </DetailBox>
                  )}

                  <DetailBox style={{ paddingTop: '12px' }}>
                    <TYPE.subHeader
                      fontWeight={500}
                      fontSize={12}
                      color={theme.subText}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <UppercaseText>
                        <Trans>Current Price</Trans>
                      </UppercaseText>
                    </TYPE.subHeader>
                    <TYPE.black fontWeight={400} fontSize={14}>
                      <CurrentPrice price={price} />
                    </TYPE.black>
                  </DetailBox>
                </DetailWrapper>
              )}

              <div style={{ position: 'relative' }}>
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : (
                  <RowBetween>
                    {!error && (
                      <ButtonConfirmed
                        onClick={onAttemptToApprove}
                        confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                        disabled={
                          approval !== ApprovalState.NOT_APPROVED ||
                          signatureData !== null ||
                          !userLiquidity ||
                          userLiquidity.equalTo('0')
                        }
                        margin="0 1rem 0 0"
                        style={{ fontSize: '16px', fontWeight: 500 }}
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
                    )}
                    <ButtonError
                      onClick={() => {
                        setShowConfirm(true)
                      }}
                      disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                      error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                    >
                      <Text fontSize={16} fontWeight={500}>
                        {error || t`Remove`}
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
