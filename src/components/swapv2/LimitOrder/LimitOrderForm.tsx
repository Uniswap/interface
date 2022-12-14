import { ChainId, Currency, CurrencyAmount, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { debounce } from 'lodash'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import ArrowRotate from 'components/ArrowRotate'
import { ButtonApprove, ButtonError, ButtonLight } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import NumericalInput from 'components/NumericalInput'
import ProgressSteps from 'components/ProgressSteps'
import { RowBetween } from 'components/Row'
import Select from 'components/Select'
import Tooltip from 'components/Tooltip'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { Z_INDEXS } from 'constants/styles'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import { NotificationType, useNotify, useWalletModalToggle } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance, useCurrencyBalances } from 'state/wallet/hooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'
import { formatNumberWithPrecisionRange } from 'utils'
import { subscribeNotificationOrderCancelled, subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import TradePrice from '../TradePrice'
import DeltaRate from './DeltaRate'
import ExpirePicker from './ExpirePicker'
import ConfirmOrderModal from './Modals/ConfirmOrderModal'
import { DEFAULT_EXPIRED, EXPIRED_OPTIONS, LIMIT_ORDER_CONTRACT } from './const'
import { calcInvert, calcOutput, calcPercentFilledOrder, calcRate, formatAmountOrder, formatUsdPrice } from './helpers'
import { getTotalActiveMakingAmount, hashOrder, submitOrder } from './request'
import { CreateOrderParam, LimitOrder, LimitOrderStatus, RateInfo } from './type'
import useBaseTradeInfo from './useBaseTradeInfo'

export const Label = styled.div`
  font-weight: 500;
  font-size: 13px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 0.5rem;
`
const Set2Market = styled(Label)`
  border-radius: 24px;
  background: ${({ theme }) => theme.tabActive};
  padding: 4px 8px;
  cursor: pointer;
  margin-bottom: 0;
  user-select: none;
`
type Props = {
  refreshListOrder: () => void
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultInputAmount?: string
  defaultOutputAmount?: string
  defaultExpire?: Date
  setIsSelectCurrencyManual?: (val: boolean) => void
  note?: string
  onCancelOrder?: () => Promise<any>
  orderInfo?: LimitOrder
  flowState: TransactionFlowState
  setFlowState: React.Dispatch<React.SetStateAction<TransactionFlowState>>
  zIndexToolTip?: number
  onDismissModalEdit?: () => void
  defaultRate?: RateInfo
  isEdit?: boolean
}

const LimitOrderForm = function LimitOrderForm({
  refreshListOrder,
  onCancelOrder,
  currencyIn,
  currencyOut,
  defaultInputAmount = '',
  defaultOutputAmount = '',
  defaultExpire,
  defaultRate = { rate: '', invertRate: '', invert: false },
  setIsSelectCurrencyManual,
  note = '',
  orderInfo,
  flowState,
  setFlowState,
  zIndexToolTip = Z_INDEXS.TOOL_TIP_ERROR_INPUT_SWAP_FORM,
  onDismissModalEdit,
  isEdit = false, // else create
}: Props) {
  const { account, chainId } = useActiveWeb3React()

  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const notify = useNotify()

  const { setCurrencyIn, setCurrencyOut, switchCurrency, setCurrentOrder, removeCurrentOrder } =
    useLimitActionHandlers()
  const { ordersUpdating } = useLimitState()

  const [inputAmount, setInputAmount] = useState(defaultInputAmount)
  const [outputAmount, setOuputAmount] = useState(defaultOutputAmount)
  const [activeOrderMakingAmount, setActiveOrderMakingAmount] = useState('')

  const [rateInfo, setRateInfo] = useState<RateInfo>(defaultRate)
  const displayRate = rateInfo.invert ? rateInfo.invertRate : rateInfo.rate

  const [expire, setExpire] = useState(DEFAULT_EXPIRED)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDateExpire, setCustomDateExpire] = useState<Date | undefined>(defaultExpire)

  const [approvalSubmitted, setApprovalSubmitted] = useState(false)

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)

  const onSetRate = (rate: string, invertRate: string) => {
    if (!currencyIn || !currencyOut) return
    const newRate = { ...rateInfo, rate, invertRate }
    if (!rate && !invertRate) {
      setRateInfo(newRate)
      return
    }

    if (rate) {
      if (inputAmount) {
        const output = calcOutput(inputAmount, rate, currencyIn.decimals, currencyOut.decimals)
        setOuputAmount(output)
      }
      if (!invertRate) {
        newRate.invertRate = calcInvert(rate)
      }
      setRateInfo(newRate)
      return
    }
    if (invertRate) {
      newRate.rate = calcInvert(invertRate)
      if (inputAmount) {
        const output = calcOutput(inputAmount, newRate.rate, currencyIn.decimals, currencyOut.decimals)
        setOuputAmount(output)
      }
      setRateInfo(newRate)
      return
    }
  }

  const onSetOutput = (output: string) => {
    if (inputAmount && parseFloat(inputAmount) !== 0 && currencyOut && output) {
      const rate = calcRate(inputAmount, output, currencyOut?.decimals)
      setRateInfo({
        ...rateInfo,
        rate,
        invertRate: calcInvert(rate),
      })
    }
    setOuputAmount(output)
  }

  const setPriceRateMarket = () => {
    try {
      if (!loadingTrade && currencyIn && tradeInfo) {
        onSetRate(tradeInfo?.price?.toSignificant(6) ?? '', tradeInfo?.price?.invert().toSignificant(6) ?? '')
      }
    } catch (error) {}
  }

  const onChangeRate = (val: string) => {
    if (currencyOut) {
      onSetRate(rateInfo.invert ? '' : val, rateInfo.invert ? val : '')
    }
  }

  const onSetInput = useCallback(
    (input: string) => {
      setInputAmount(input)
      if (!input) {
        setOuputAmount('')
        setRateInfo({ ...rateInfo, rate: '', invertRate: '' })
        return
      }
      if (rateInfo.rate && currencyIn && currencyOut && input) {
        setOuputAmount(calcOutput(input, rateInfo.rate, currencyIn.decimals, currencyOut.decimals))
      }
    },
    [rateInfo, currencyIn, currencyOut],
  )

  const onInvertRate = (invert: boolean) => {
    setRateInfo({ ...rateInfo, invert })
  }

  const balances = useCurrencyBalances(useMemo(() => [currencyIn, currencyOut], [currencyIn, currencyOut]))

  const maxAmountInput = maxAmountSpend(balances[0])
  const handleMaxInput = useCallback(() => {
    maxAmountInput && onSetInput(maxAmountInput?.toExact())
  }, [maxAmountInput, onSetInput])

  const handleHalfInput = useCallback(() => {
    onSetInput(balances[0]?.divide(2).toExact() || '')
  }, [balances, onSetInput])

  const handleInputSelect = (currency: Currency) => {
    if (currencyOut && currency?.equals(currencyOut)) return
    setCurrencyIn(currency)
    setIsSelectCurrencyManual?.(true)
  }
  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) return
    setCurrencyOut(currency)
    setIsSelectCurrencyManual?.(true)
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    setRotate(prev => !prev)
    switchCurrency()
    setIsSelectCurrencyManual?.(true)
  }

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    LIMIT_ORDER_CONTRACT,
  ) as CurrencyAmount<Currency>

  const parsedActiveOrderMakingAmount = useMemo(() => {
    try {
      if (currencyIn && activeOrderMakingAmount) {
        const value = TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(activeOrderMakingAmount))
        if (isEdit && orderInfo) {
          return value.subtract(TokenAmount.fromRawAmount(currencyIn, JSBI.BigInt(orderInfo.makingAmount)))
        }
        return value
      }
    } catch (error) {}
    return undefined
  }, [currencyIn, activeOrderMakingAmount, isEdit, orderInfo])

  const enoughAllowance = useMemo(() => {
    return (
      currencyIn?.isNative ||
      (parsedActiveOrderMakingAmount &&
        parseInputAmount &&
        currentAllowance?.subtract(parsedActiveOrderMakingAmount).greaterThan(parseInputAmount))
    )
  }, [currencyIn?.isNative, currentAllowance, parseInputAmount, parsedActiveOrderMakingAmount])

  const [approval, approveCallback] = useApproveCallback(parseInputAmount, LIMIT_ORDER_CONTRACT, !enoughAllowance)

  const balance = useCurrencyBalance(currencyIn ?? undefined)
  const inputError = useMemo(() => {
    if (!inputAmount) return
    if (parseFloat(inputAmount) === 0 && (parseFloat(outputAmount) === 0 || parseFloat(displayRate) === 0)) {
      return t`Invalid input amount`
    }
    if (balance && parseInputAmount?.greaterThan(balance)) {
      return t`Insufficient ${currencyIn?.symbol} balance`
    }

    const remainBalance = parsedActiveOrderMakingAmount ? balance?.subtract(parsedActiveOrderMakingAmount) : undefined
    if (parseInputAmount && remainBalance?.lessThan(parseInputAmount)) {
      const formatNum = formatNumberWithPrecisionRange(parseFloat(remainBalance.toFixed(3)), 0, 10)
      return t`You don't have sufficient ${currencyIn?.symbol} balance. After your active orders, you have ${
        Number(formatNum) !== 0 ? '~' : ''
      }${formatNum} ${currencyIn?.symbol} left.`
    }

    if (!parseInputAmount) {
      return t`Your input amount is invalid.`
    }
    return
  }, [currencyIn, balance, inputAmount, outputAmount, displayRate, parsedActiveOrderMakingAmount, parseInputAmount])

  const outPutError = useMemo(() => {
    if (outputAmount && !tryParseAmount(outputAmount, currencyOut)) {
      return t`Your output amount is invalid.`
    }
    return
  }, [outputAmount, currencyOut])

  const hasInputError = inputError || outPutError

  const hasInvalidInput = [outputAmount, inputAmount, currencyIn, currencyOut, displayRate].some(e => !e)

  const showApproveFlow =
    !hasInvalidInput &&
    !hasInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      !enoughAllowance ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const disableBtnApproved =
    (approval !== ApprovalState.NOT_APPROVED || approvalSubmitted || !!hasInputError) && enoughAllowance
  const disableBtnReview = hasInvalidInput || !!hasInputError || approval !== ApprovalState.APPROVED

  const expiredAt = customDateExpire?.getTime() || Date.now() + expire * 1000

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return
    setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
  }

  const hidePreview = useCallback(() => {
    setFlowState(state => ({ ...state, showConfirm: false }))
  }, [setFlowState])

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker)
  }

  const onChangeExpire = (val: Date | number) => {
    if (typeof val === 'number') {
      setExpire(val)
      setCustomDateExpire(undefined)
    } else {
      setCustomDateExpire(val)
    }
  }

  const getActiveMakingAmount = useCallback(
    async (currencyIn: Currency) => {
      try {
        if (!currencyIn?.wrapped.address || !account) return
        const { activeMakingAmount } = await getTotalActiveMakingAmount(
          chainId + '',
          currencyIn?.wrapped.address,
          account,
        )
        setActiveOrderMakingAmount(activeMakingAmount)
      } catch (error) {
        console.log(error)
      }
    },
    [account, chainId],
  )

  const onResetForm = () => {
    setInputAmount(defaultInputAmount)
    setOuputAmount(defaultOutputAmount)
    setRateInfo(defaultRate)
    setExpire(DEFAULT_EXPIRED)
    setCustomDateExpire(undefined)
    currencyIn && getActiveMakingAmount(currencyIn)
  }

  const handleError = useCallback(
    (error: any) => {
      const errorCode: string = error?.response?.data?.code || error.code || ''
      const mapErrorMessageByErrCode: { [code: string]: string } = {
        4001: t`User denied message signature`,
        4002: t`You don't have sufficient fund for this transaction.`,
        4004: t`Invalid signature`,
      }
      const msg = mapErrorMessageByErrCode[errorCode]
      console.error(error)
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: msg || 'Error occur. Please try again.',
      }))
    },
    [setFlowState],
  )

  const { library } = useWeb3React()

  const getPayloadCreateOrder = (params: CreateOrderParam) => {
    const { currencyIn, currencyOut, chainId, account, inputAmount, outputAmount, expiredAt } = params
    const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
    return {
      chainId: chainId.toString(),
      makerAsset: currencyIn?.wrapped.address,
      takerAsset: currencyOut?.wrapped.address,
      maker: account,
      makingAmount: parseInputAmount?.quotient?.toString(),
      takingAmount: tryParseAmount(outputAmount, currencyOut)?.quotient?.toString(),
      expiredAt: (expiredAt / 1000) | 0,
    }
  }

  const signOrder = async (params: CreateOrderParam) => {
    const { currencyIn, currencyOut, inputAmount, outputAmount } = params
    if (!library || !currencyIn || !currencyOut) return { signature: '', orderHash: '' }
    const payload = getPayloadCreateOrder(params)
    const { hash: orderHash } = await hashOrder(payload)
    setFlowState(state => ({
      ...state,
      pendingText: `Sign limit order: ${formatAmountOrder(inputAmount, false)} ${
        currencyIn.symbol
      } to ${formatAmountOrder(outputAmount, false)} ${currencyOut.symbol}`,
    }))
    const signature = await library.getSigner().signMessage(ethers.utils.arrayify(orderHash))
    return { signature, orderHash }
  }

  const onSubmitCreateOrder = async (params: CreateOrderParam) => {
    try {
      const { currencyIn, currencyOut, chainId, account, inputAmount, outputAmount, expiredAt } = params
      if (
        !library ||
        !currencyIn ||
        !currencyOut ||
        !chainId ||
        !account ||
        !inputAmount ||
        !outputAmount ||
        !expiredAt
      ) {
        throw new Error('wrong input')
      }

      let signature = params.signature
      let orderHash = params.orderHash
      if (!signature && !orderHash) {
        setFlowState(state => ({
          ...state,
          attemptingTxn: true,
          showConfirm: true,
          pendingText: t`Sign limit order: ${formatAmountOrder(inputAmount, false)} ${
            currencyIn.symbol
          } to ${formatAmountOrder(outputAmount, false)} ${currencyOut.symbol}`,
        }))
        const signData = await signOrder(params)
        signature = signData.signature
        orderHash = signData.orderHash
      }

      const payload = getPayloadCreateOrder(params)
      setFlowState(state => ({ ...state, pendingText: t`Placing order` }))
      await submitOrder({ ...payload, orderHash, signature })
      setFlowState(state => ({ ...state, showConfirm: false }))
      notify(
        {
          type: NotificationType.SUCCESS,
          title: isEdit ? t`Order Edited` : t`Order Placed`,
          summary: (
            <Text color={theme.text} lineHeight="18px">
              <Trans>
                You have successfully placed an order to pay{' '}
                <Text as="span" fontWeight={500}>
                  {formatAmountOrder(inputAmount, false)} {currencyIn.symbol}
                </Text>{' '}
                and receive{' '}
                <Text as="span" fontWeight={500}>
                  {formatAmountOrder(outputAmount, false)} {currencyOut.symbol}{' '}
                </Text>
                <Text as="span" color={theme.subText}>
                  when 1 {currencyIn.symbol} is equal to {calcRate(inputAmount, outputAmount, currencyOut.decimals)}{' '}
                  {currencyOut.symbol}.
                </Text>
              </Trans>
              {isEdit &&
                (() => {
                  const isPartialFilled = orderInfo?.status === LimitOrderStatus.PARTIALLY_FILLED
                  const filledPercent =
                    orderInfo && isPartialFilled
                      ? calcPercentFilledOrder(orderInfo?.filledTakingAmount, orderInfo?.takingAmount)
                      : ''
                  return (
                    <>
                      <br />
                      {isPartialFilled ? (
                        <Trans>
                          Your previous order which was {filledPercent}% filled was automatically cancelled.
                        </Trans>
                      ) : (
                        <Trans>Your previous order was automatically cancelled.</Trans>
                      )}
                    </>
                  )
                })()}
            </Text>
          ),
        },
        10000,
      )
      onResetForm()
      setTimeout(() => refreshListOrder?.(), 500)
    } catch (error) {
      handleError(error)
    }
  }

  const onSubmitEditOrder = async () => {
    try {
      if (!onCancelOrder) return
      await onCancelOrder()
      if (orderInfo) {
        const param = {
          orderId: orderInfo?.id,
          account,
          chainId,
          currencyIn,
          currencyOut,
          inputAmount,
          outputAmount,
          expiredAt,
        }
        const { signature, orderHash } = await signOrder(param)
        setCurrentOrder({
          ...param,
          orderHash,
          signature,
        })
      }
      onDismissModalEdit?.()
    } catch (error) {
      orderInfo && removeCurrentOrder(orderInfo.id)
      handleError(error)
    }
  }
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const refreshActiveMakingAmount = useMemo(
    () =>
      debounce(data => {
        if (currencyIn) {
          getActiveMakingAmount(currencyIn)
        }
      }, 500),
    [currencyIn, getActiveMakingAmount],
  )
  const refSubmitCreateOrder = useRef(onSubmitCreateOrder)
  refSubmitCreateOrder.current = onSubmitCreateOrder

  useEffect(() => {
    if (!account || !chainId || !currencyIn) return
    // call when currencyIn change or cancel expired/cancelled
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      data?.orders.forEach(order => {
        const findInfo = ordersUpdating.find(e => e.orderId === order.id)
        if (findInfo?.orderId) {
          removeCurrentOrder(findInfo.orderId)
          if (order.isSuccessful) refSubmitCreateOrder.current(findInfo)
        }
      })
      refreshActiveMakingAmount(data)
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refreshActiveMakingAmount)
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
    }
  }, [account, chainId, currencyIn, refreshActiveMakingAmount, ordersUpdating, removeCurrentOrder])

  const styleTooltip = { maxWidth: '250px', zIndex: zIndexToolTip }
  return (
    <>
      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        {!isEdit && (
          <RowBetween style={{ gap: '12px' }}>
            <CurrencyInputPanel
              hideBalance
              value={inputAmount}
              hideInput={true}
              onCurrencySelect={handleInputSelect}
              currency={currencyIn}
              showCommonBases
              onMax={null}
              onHalf={null}
              id="create-limit-order-input-tokena"
              maxCurrencySymbolLength={6}
              otherCurrency={currencyOut}
              supportNative={false}
            />
            <ArrowRotate isVertical rotate={rotate} onClick={handleRotateClick} />

            <CurrencyInputPanel
              hideBalance
              value={outputAmount}
              hideInput={true}
              onHalf={null}
              onMax={null}
              id="create-limit-order-input-tokenb"
              onCurrencySelect={handleOutputSelect}
              positionMax="top"
              currency={currencyOut}
              showCommonBases
              maxCurrencySymbolLength={6}
              otherCurrency={currencyIn}
            />
          </RowBetween>
        )}

        <Flex flexDirection={'column'}>
          <Label>
            <Trans>You Pay</Trans>
          </Label>
          <Tooltip text={inputError} show={!!inputError} placement="top" style={styleTooltip} width="fit-content">
            <CurrencyInputPanel
              maxLength={16}
              error={!!inputError}
              value={inputAmount}
              positionMax="top"
              currency={currencyIn}
              onUserInput={onSetInput}
              onMax={handleMaxInput}
              onHalf={handleHalfInput}
              otherCurrency={currencyOut}
              id="swap-currency-input"
              disableCurrencySelect
              estimatedUsd={formatUsdPrice(inputAmount, tradeInfo?.amountInUsd)}
            />
          </Tooltip>
        </Flex>

        <Flex justifyContent={'space-between'} alignItems="center" style={{ gap: '1rem' }}>
          <Flex flexDirection={'column'} flex={1} style={{ gap: '0.75rem' }}>
            <Flex justifyContent={'space-between'} alignItems="flex-end">
              <DeltaRate marketPrice={tradeInfo?.price} rateInfo={rateInfo} />

              <Set2Market onClick={setPriceRateMarket}>
                <Trans>Set to Market</Trans>
              </Set2Market>
            </Flex>
            <Flex alignItems={'center'} style={{ background: theme.buttonBlack, borderRadius: 12, paddingRight: 12 }}>
              <NumericalInput
                maxLength={16}
                style={{ borderRadius: 12, padding: '10px 12px', fontSize: 14, height: 48 }}
                value={displayRate}
                onUserInput={onChangeRate}
              />
              {currencyIn && currencyOut && (
                <Flex style={{ gap: 6, cursor: 'pointer' }} onClick={() => onInvertRate(!rateInfo.invert)}>
                  <Text fontSize={14} color={theme.subText}>
                    {rateInfo.invert
                      ? `${currencyOut?.symbol}/${currencyIn?.symbol}`
                      : `${currencyIn?.symbol}/${currencyOut?.symbol}`}
                  </Text>
                  <div>
                    <Repeat color={theme.subText} size={12} />
                  </div>
                </Flex>
              )}
            </Flex>
            <TradePrice price={tradeInfo?.price} style={{ width: 'fit-content' }} />
          </Flex>
        </Flex>

        <Flex flexDirection={'column'}>
          <Label>
            <Trans>You Receive</Trans>
          </Label>
          <Tooltip text={outPutError} show={!!outPutError} placement="top" style={styleTooltip} width="fit-content">
            <CurrencyInputPanel
              maxLength={16}
              value={outputAmount}
              error={!!outPutError}
              disableCurrencySelect
              currency={currencyOut}
              onUserInput={onSetOutput}
              otherCurrency={currencyOut}
              id="swap-currency-output"
              onMax={null}
              onHalf={null}
              estimatedUsd={formatUsdPrice(outputAmount, tradeInfo?.amountOutUsd)}
            />
          </Tooltip>
        </Flex>

        <Select
          forceMenuPlacementTop={isEdit}
          value={expire}
          onChange={onChangeExpire}
          style={{ width: '100%', height: 48 }}
          menuStyle={{ right: 12, left: 'unset' }}
          options={[...EXPIRED_OPTIONS, { label: 'Custom', onSelect: toggleDatePicker }]}
          activeRender={item => (
            <Flex justifyContent={'space-between'}>
              <Text>
                <Trans>Expires In</Trans>
              </Text>
              <Text color={theme.text} fontSize={14}>
                {customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : item?.label}
              </Text>
            </Flex>
          )}
        />

        {chainId !== ChainId.ETHW && <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} />}

        {!account ? (
          <ButtonLight onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        ) : (
          showApproveFlow && (
            <>
              <RowBetween>
                <ButtonApprove
                  forceApprove={!enoughAllowance}
                  tokenSymbol={currencyIn?.symbol}
                  tooltipMsg={t`You need to first allow KyberSwaps smart contracts to use your ${currencyIn?.symbol}. This has to be done only once for each token.`}
                  onClick={approveCallback}
                  disabled={!!disableBtnApproved}
                  approval={approval}
                />
                <ButtonError width="48%" id="swap-button" disabled={disableBtnReview} onClick={showPreview}>
                  <Text fontSize={16} fontWeight={500}>
                    <Trans>Review Order</Trans>
                  </Text>
                </ButtonError>
              </RowBetween>
              <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
            </>
          )
        )}
        {!showApproveFlow && account && (
          <ButtonError onClick={showPreview} disabled={disableBtnReview}>
            <Text fontWeight={500}>
              <Trans>Review Order</Trans>
            </Text>
          </ButtonError>
        )}
      </Flex>
      <ConfirmOrderModal
        flowState={flowState}
        onDismiss={hidePreview}
        onSubmit={
          isEdit
            ? onSubmitEditOrder
            : () =>
                onSubmitCreateOrder({ currencyIn, currencyOut, chainId, account, inputAmount, outputAmount, expiredAt })
        }
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        inputAmount={inputAmount}
        outputAmount={outputAmount}
        expireAt={expiredAt}
        rateInfo={rateInfo}
        marketPrice={tradeInfo?.price}
        note={note}
      />
      <ExpirePicker
        defaultDate={customDateExpire}
        expire={expire}
        isOpen={showDatePicker}
        onDismiss={toggleDatePicker}
        onSetDate={onChangeExpire}
      />
    </>
  )
}

export default memo(LimitOrderForm)
