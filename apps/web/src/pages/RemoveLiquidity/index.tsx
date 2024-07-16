import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import type { TransactionResponse } from '@ethersproject/providers'
import {
  InterfaceElementName,
  InterfaceEventName,
  LiquidityEventName,
  LiquiditySource,
} from '@uniswap/analytics-events'
import { Currency, Percent, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePairAddress } from '@uniswap/v2-sdk'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlueCard, LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { DoubleCurrencyLogo } from 'components/DoubleLogo'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import Row, { RowBetween, RowFixed } from 'components/Row'
import Slider from 'components/Slider'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { V2Unsupported } from 'components/V2Unsupported'
import { Dots } from 'components/swap/styled'
import { useIsSupportedChainId } from 'constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { usePairContract, useV2RouterContract } from 'hooks/useContract'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { useV2LiquidityTokenPermit } from 'hooks/useV2LiquidityTokenPermit'
import { Trans } from 'i18n'
import { useTheme } from 'lib/styled-components'
import AppBody from 'pages/App/AppBody'
import { PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { ClickableText, MaxButton, Wrapper } from 'pages/Pool/styled'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import { Field } from 'state/burn/actions'
import { useBurnActionHandlers, useBurnState, useDerivedBurnInfo } from 'state/burn/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { StyledInternalLink, ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { calculateSlippageAmount } from 'utils/calculateSlippageAmount'
import { currencyId } from 'utils/currencyId'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function RemoveLiquidityWrapper() {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  if (isSupportedChain && currencyA !== currencyB) {
    return <RemoveLiquidity />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function RemoveLiquidity() {
  const navigate = useNavigate()
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const account = useAccount()
  const signer = useEthersSigner()
  const [tokenA, tokenB] = useMemo(() => [currencyA?.wrapped, currencyB?.wrapped], [currencyA, currencyB])

  const theme = useTheme()
  const trace = useTrace()

  // toggle wallet when disconnected
  const accountDrawer = useAccountDrawer()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const getDeadline = useGetTransactionDeadline()
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE)

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

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  const router = useV2RouterContract()

  // allowance handling
  const { gatherPermitSignature, signatureData } = useV2LiquidityTokenPermit(
    parsedAmounts[Field.LIQUIDITY],
    router?.address,
  )
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], router?.address)

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !signer) {
      throw new Error('missing dependencies')
    }
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) {
      throw new Error('missing liquidity amount')
    }

    if (gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveCallback()
        }
      }
    } else {
      await approveCallback()
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
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
  const addTransaction = useTransactionAdder()

  const networkSupportsV2 = useNetworkSupportsV2()

  async function onRemove() {
    if (account.status !== 'connected' || !signer || !router || !networkSupportsV2) {
      throw new Error('missing dependencies')
    }
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) {
      throw new Error('missing tokens')
    }
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) {
      throw new Error('missing liquidity amount')
    }

    const currencyBIsETH = currencyB.isNative
    const oneCurrencyIsETH = currencyA.isNative || currencyBIsETH

    if (!tokenA || !tokenB) {
      throw new Error('could not wrap')
    }

    const deadline = await getDeadline()
    if (!deadline) {
      throw new Error('could not get deadline')
    }

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account.address,
          deadline.toHexString(),
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account.address,
          deadline.toHexString(),
        ]
      }
    }
    // we have a signature, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.quotient.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account.address,
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
          liquidityAmount.quotient.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account.address,
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
      methodNames.map((methodName) =>
        router.estimateGas[methodName](...args)
          .then((estimateGas) => calculateGasMargin(estimateGas))
          .catch((error) => {
            logger.info('RemoveLiquidity', 'onRemove', 'estimateGas failed', {
              message: error.message,
              methodName,
              args,
            })
            return undefined
          }),
      ),
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate),
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      logger.warn('RemoveLiquidity', 'onRemove', 'This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            type: TransactionType.REMOVE_LIQUIDITY_V3,
            baseCurrencyId: currencyId(currencyA),
            quoteCurrencyId: currencyId(currencyB),
            expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient.toString() ?? '0',
            expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient.toString() ?? '0',
          })

          setTxHash(response.hash)

          sendAnalyticsEvent(LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED, {
            label: [currencyA.symbol, currencyB.symbol].join('/'),
            source: LiquiditySource.V2,
            ...trace,
            type: LiquiditySource.V2,
            transaction_hash: response.hash,
            pool_address: computePairAddress({
              factoryAddress: V2_FACTORY_ADDRESSES[currencyA.chainId],
              tokenA: currencyA.wrapped,
              tokenB: currencyB.wrapped,
            }),
          })
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          logger.error(error, {
            tags: {
              file: 'RemoveLiquidity',
              function: 'onRemove',
            },
          })
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap="md" style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight="$medium">
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={24} />
            <Text fontSize={24} fontWeight="$medium" ml={10}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.neutral2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight="$medium">
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={24} />
            <Text fontSize={24} fontWeight="$medium" ml={10}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <Text fontSize={12} fontStyle="italic" color="neutral2" textAlign="left" pt={12}>
          <Trans
            i18nKey="removeLiquidity.outputEstimated"
            values={{
              allowed: allowedSlippage.toSignificant(4),
            }}
          />
        </Text>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color="$neutral2" fontWeight="$medium" fontSize={16}>
            <Trans
              i18nKey="removeLiquidity.uniBurned"
              values={{
                a: currencyA?.symbol,
                b: currencyB?.symbol,
              }}
            />
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currencies={[currencyA, currencyB]} />
            <Text fontWeight="$medium" fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        {pair && (
          <>
            <RowBetween>
              <Text color="$neutral2" fontWeight="$medium" fontSize={16}>
                <Trans i18nKey="common.price" />
              </Text>
              <Text fontWeight="$medium" fontSize={16} color="$neutral1">
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight="$medium" fontSize={16} color="$neutral1">
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )}
        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <Text fontWeight="$medium" fontSize={20}>
            <Trans i18nKey="common.confirm" />
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const pendingText = (
    <Trans
      i18nKey="removeLiquidity.pendingText"
      values={{
        amtA: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6),
        symA: currencyA?.symbol,
        amtB: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6),
        symB: currencyB?.symbol,
      }}
    />
  )

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const oneCurrencyIsETH = currencyA?.isNative || currencyB?.isNative

  const oneCurrencyIsWETH = Boolean(
    account.status === 'connected' &&
      account.chainId &&
      WRAPPED_NATIVE_CURRENCY[account.chainId] &&
      ((currencyA && WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(currencyA)) ||
        (currencyB && WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(currencyB))),
  )

  const handleSelectCurrencyA = useCallback(
    (currency: Currency) => {
      if (currencyIdB && currencyId(currency) === currencyIdB) {
        navigate(`/remove/v2/${currencyId(currency)}/${currencyIdA}`)
      } else {
        navigate(`/remove/v2/${currencyId(currency)}/${currencyIdB}`)
      }
    },
    [currencyIdA, currencyIdB, navigate],
  )
  const handleSelectCurrencyB = useCallback(
    (currency: Currency) => {
      if (currencyIdA && currencyId(currency) === currencyIdA) {
        navigate(`/remove/v2/${currencyIdB}/${currencyId(currency)}`)
      } else {
        navigate(`/remove/v2/${currencyIdA}/${currencyId(currency)}`)
      }
    },
    [currencyIdA, currencyIdB, navigate],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
  )

  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={false} adding={false} autoSlippage={DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            reviewContent={() => (
              <ConfirmationModalContent
                title={<Trans i18nKey="common.youWillReceive" />}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="md">
            <BlueCard>
              <AutoColumn gap="10px">
                <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                  <Trans i18nKey="removeLiquidity.removingTokensTip" />
                </ThemedText.DeprecatedLink>
              </AutoColumn>
            </BlueCard>
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <Text fontWeight="$medium">
                    <Trans i18nKey="common.removeAmount" />
                  </Text>
                  <ClickableText
                    fontWeight={535}
                    onClick={() => {
                      setShowDetailed(!showDetailed)
                    }}
                  >
                    {showDetailed ? <Trans i18nKey="common.simple.label" /> : <Trans i18nKey="common.detailed.label" />}
                  </ClickableText>
                </RowBetween>
                <Row style={{ alignItems: 'flex-end' }}>
                  <Text fontSize={72} fontWeight="$medium">
                    {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                  </Text>
                </Row>
                {!showDetailed && (
                  <>
                    <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                    <RowBetween>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')} width="20%">
                        <Trans i18nKey="common.percentage" values={{ pct: '25' }} />
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')} width="20%">
                        <Trans i18nKey="common.percentage" values={{ pct: '50' }} />
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')} width="20%">
                        <Trans i18nKey="common.percentage" values={{ pct: '75' }} />
                      </MaxButton>
                      <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')} width="20%">
                        <Trans i18nKey="common.max" />
                      </MaxButton>
                    </RowBetween>
                  </>
                )}
              </AutoColumn>
            </LightCard>
            {!showDetailed && (
              <>
                <ColumnCenter>
                  <ArrowDown size="16" color={theme.neutral2} />
                </ColumnCenter>
                <LightCard>
                  <AutoColumn gap="10px">
                    <RowBetween>
                      <Text fontSize={24} fontWeight="$medium">
                        {formattedAmounts[Field.CURRENCY_A] || '-'}
                      </Text>
                      <RowFixed>
                        <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
                        <Text fontSize={24} fontWeight="$medium" id="remove-liquidity-tokena-symbol">
                          {currencyA?.symbol}
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <Text fontSize={24} fontWeight="$medium">
                        {formattedAmounts[Field.CURRENCY_B] || '-'}
                      </Text>
                      <RowFixed>
                        <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
                        <Text fontSize={24} fontWeight="$medium" id="remove-liquidity-tokenb-symbol">
                          {currencyB?.symbol}
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    {account.status === 'connected' && account.chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
                      <RowBetween style={{ justifyContent: 'flex-end' }}>
                        {oneCurrencyIsETH ? (
                          <StyledInternalLink
                            to={`/remove/v2/${
                              currencyA?.isNative && WRAPPED_NATIVE_CURRENCY[account.chainId]
                                ? WRAPPED_NATIVE_CURRENCY[account.chainId]?.address
                                : currencyIdA
                            }/${
                              currencyB?.isNative && WRAPPED_NATIVE_CURRENCY[account.chainId]
                                ? WRAPPED_NATIVE_CURRENCY[account.chainId]?.address
                                : currencyIdB
                            }`}
                          >
                            Receive WETH
                          </StyledInternalLink>
                        ) : oneCurrencyIsWETH ? (
                          <StyledInternalLink
                            to={`/remove/v2/${
                              currencyA && WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(currencyA)
                                ? 'ETH'
                                : currencyIdA
                            }/${
                              currencyB && WRAPPED_NATIVE_CURRENCY[account.chainId]?.equals(currencyB)
                                ? 'ETH'
                                : currencyIdB
                            }`}
                          >
                            Receive ETH
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
                  currency={pair?.liquidityToken}
                  pair={pair}
                  id="liquidity-amount"
                />
                <ColumnCenter>
                  <ArrowDown size="16" color={theme.neutral2} />
                </ColumnCenter>
                <CurrencyInputPanel
                  hideBalance={true}
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onCurrencyAInput}
                  onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                  showMaxButton={!atMaxAmount}
                  currency={currencyA}
                  label="Output"
                  onCurrencySelect={handleSelectCurrencyA}
                  id="remove-liquidity-tokena"
                />
                <ColumnCenter>
                  <Plus size="16" color={theme.neutral2} />
                </ColumnCenter>
                <CurrencyInputPanel
                  hideBalance={true}
                  value={formattedAmounts[Field.CURRENCY_B]}
                  onUserInput={onCurrencyBInput}
                  onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                  showMaxButton={!atMaxAmount}
                  currency={currencyB}
                  label="Output"
                  onCurrencySelect={handleSelectCurrencyB}
                  id="remove-liquidity-tokenb"
                />
              </>
            )}
            {pair && (
              <div style={{ padding: '10px 20px' }}>
                <RowBetween>
                  <Trans i18nKey="common.price" />:
                  <div>
                    1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                  </div>
                </RowBetween>
                <RowBetween>
                  <div />
                  <div>
                    1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                  </div>
                </RowBetween>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              {account.status !== 'connected' ? (
                <Trace
                  logPress
                  eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                  properties={{ received_swap_quote: false }}
                  element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                >
                  <ButtonLight onClick={accountDrawer.open}>
                    <Trans i18nKey="common.connectWallet.button" />
                  </ButtonLight>
                </Trace>
              ) : (
                <RowBetween>
                  <ButtonConfirmed
                    onClick={onAttemptToApprove}
                    confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                    disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                    mr="0.5rem"
                    fontWeight={535}
                    fontSize={16}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <Dots>
                        <Trans i18nKey="common.approving" />
                      </Dots>
                    ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                      <Trans i18nKey="common.approved" />
                    ) : (
                      <Trans i18nKey="common.approve" />
                    )}
                  </ButtonConfirmed>
                  <ButtonError
                    onClick={() => {
                      setShowConfirm(true)
                    }}
                    disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                    error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                  >
                    <Text fontSize={16} fontWeight="$medium">
                      {error || <Trans i18nKey="common.remove.label" />}
                    </Text>
                  </ButtonError>
                </RowBetween>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {pair ? (
        <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
        </AutoColumn>
      ) : null}
    </>
  )
}
