import { ChainId, Currency, CurrencyAmount, Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
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
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import NumericalInput from 'components/NumericalInput'
import { RowBetween } from 'components/Row'
import Select from 'components/Select'
import Tooltip from 'components/Tooltip'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import ActionButtonLimitOrder from 'components/swapv2/LimitOrder/ActionButtonLimitOrder'
import DeltaRate, { useGetDeltaRateLimitOrder } from 'components/swapv2/LimitOrder/DeltaRate'
import ConfirmOrderModal from 'components/swapv2/LimitOrder/Modals/ConfirmOrderModal'
import useBaseTradeInfo from 'components/swapv2/LimitOrder/useBaseTradeInfo'
import useWrapEthStatus from 'components/swapv2/LimitOrder/useWrapEthStatus'
import TradePrice from 'components/swapv2/TradePrice'
import { Z_INDEXS } from 'constants/styles'
import { useTokenAllowance } from 'data/Allowances'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import useWrapCallback from 'hooks/useWrapCallback'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { NotificationType, useNotify } from 'state/application/hooks'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'
import { formatNumberWithPrecisionRange } from 'utils'
import { subscribeNotificationOrderCancelled, subscribeNotificationOrderExpired } from 'utils/firebase'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import ExpirePicker from './ExpirePicker'
import { DEFAULT_EXPIRED, EXPIRED_OPTIONS } from './const'
import {
  calcInvert,
  calcOutput,
  calcRate,
  calcUsdPrices,
  formatAmountOrder,
  getErrorMessage,
  getPayloadCreateOrder,
} from './helpers'
import { clearCacheActiveMakingAmount, getMessageSignature, getTotalActiveMakingAmount, submitOrder } from './request'
import { CreateOrderParam, LimitOrder, RateInfo } from './type'

export const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`
const Set2Market = styled(Label)`
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  user-select: none;
  margin: 0;
`
const INPUT_HEIGHT = 28

type Props = {
  refreshListOrder: () => void
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultInputAmount?: string
  defaultOutputAmount?: string
  defaultActiveMakingAmount?: string
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

const InputWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 12px;
  flex: 1;
  padding: 12px;
  flex-direction: column;
  gap: 0.5rem;
  display: flex;
`
const LimitOrderForm = function LimitOrderForm({
  refreshListOrder,
  onCancelOrder,
  currencyIn,
  currencyOut,
  defaultInputAmount = '',
  defaultOutputAmount = '',
  defaultActiveMakingAmount = '',
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
  const { account, chainId, networkInfo } = useActiveWeb3React()

  const theme = useTheme()
  const notify = useNotify()
  const { mixpanelHandler } = useMixpanel()

  const { setCurrencyIn, setCurrencyOut, switchCurrency, setCurrentOrder, removeCurrentOrder, resetState } =
    useLimitActionHandlers()
  const { ordersUpdating, inputAmount: inputAmountGlobal } = useLimitState()

  const [inputAmount, setInputAmount] = useState(defaultInputAmount)
  const [outputAmount, setOuputAmount] = useState(defaultOutputAmount)
  const [activeOrderMakingAmount, setActiveOrderMakingAmount] = useState(defaultActiveMakingAmount)

  const [rateInfo, setRateInfo] = useState<RateInfo>(defaultRate)
  const displayRate = rateInfo.invert ? rateInfo.invertRate : rateInfo.rate

  const [expire, setExpire] = useState(DEFAULT_EXPIRED)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customDateExpire, setCustomDateExpire] = useState<Date | undefined>(defaultExpire)

  const [approvalSubmitted, setApprovalSubmitted] = useState(false)
  const { library } = useWeb3React()

  const { loading: loadingTrade, tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)
  const { tradeInfo: tradeInfoInvert } = useBaseTradeInfo(currencyOut, currencyIn)
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo?.price, rateInfo })

  const { execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencyIn, currencyOut, inputAmount, true)
  const showWrap = !!currencyIn?.isNative

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
      mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'set price')
      if (loadingTrade || !tradeInfo) return
      onSetRate(tradeInfo?.price?.toSignificant(6) ?? '', tradeInfo?.price?.invert().toSignificant(6) ?? '')
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

  const handleInputSelect = useCallback(
    (currency: Currency) => {
      if (currencyOut && currency?.equals(currencyOut)) return
      setCurrencyIn(currency)
      setIsSelectCurrencyManual?.(true)
    },
    [currencyOut, setCurrencyIn, setIsSelectCurrencyManual],
  )

  const switchToWeth = useCallback(() => {
    handleInputSelect(currencyIn?.wrapped as Currency)
  }, [currencyIn, handleInputSelect])

  const { isWrappingEth, setTxHashWrapped } = useWrapEthStatus(switchToWeth)

  const handleOutputSelect = (currency: Currency) => {
    if (currencyIn && currency?.equals(currencyIn)) return
    setCurrencyOut(currency)
    setIsSelectCurrencyManual?.(true)
  }

  const [rotate, setRotate] = useState(false)
  const handleRotateClick = () => {
    if (isEdit) return
    setRotate(prev => !prev)
    switchCurrency()
    setIsSelectCurrencyManual?.(true)
  }

  const parseInputAmount = tryParseAmount(inputAmount, currencyIn ?? undefined)
  const currentAllowance = useTokenAllowance(
    currencyIn as Token,
    account ?? undefined,
    networkInfo.limitOrder ?? '',
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

  const balance = useCurrencyBalance(currencyIn)
  const maxAmountInput = maxAmountSpend(balance)

  const handleMaxInput = useCallback(() => {
    if (!parsedActiveOrderMakingAmount || !maxAmountInput) return
    onSetInput(maxAmountInput.subtract(parsedActiveOrderMakingAmount)?.toExact())
  }, [maxAmountInput, onSetInput, parsedActiveOrderMakingAmount])

  const enoughAllowance = useMemo(() => {
    try {
      return Boolean(
        currencyIn?.isNative ||
          (parsedActiveOrderMakingAmount &&
            parseInputAmount &&
            currentAllowance?.subtract(parsedActiveOrderMakingAmount).greaterThan(parseInputAmount)),
      )
    } catch (error) {
      return false
    }
  }, [currencyIn?.isNative, currentAllowance, parseInputAmount, parsedActiveOrderMakingAmount])

  const [approval, approveCallback] = useApproveCallback(
    parseInputAmount,
    networkInfo.limitOrder ?? '',
    !enoughAllowance,
  )

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

    if (showWrap && wrapInputError) return wrapInputError
    return
  }, [
    currencyIn,
    balance,
    inputAmount,
    outputAmount,
    displayRate,
    parsedActiveOrderMakingAmount,
    parseInputAmount,
    showWrap,
    wrapInputError,
  ])

  const outPutError = useMemo(() => {
    if (outputAmount && !tryParseAmount(outputAmount, currencyOut)) {
      return t`Your output amount is invalid.`
    }
    return
  }, [outputAmount, currencyOut])

  const hasInputError = Boolean(inputError || outPutError)
  const checkingAllowance =
    !(currencyIn && parsedActiveOrderMakingAmount?.currency?.equals(currencyIn)) ||
    !(currencyIn && currentAllowance?.currency?.equals(currencyIn))

  const isNotFillAllInput = [outputAmount, inputAmount, currencyIn, currencyOut, displayRate].some(e => !e)

  const expiredAt = customDateExpire?.getTime() || Date.now() + expire * 1000

  const showPreview = () => {
    if (!currencyIn || !currencyOut || !outputAmount || !inputAmount || !displayRate) return
    setFlowState({ ...TRANSACTION_STATE_DEFAULT, showConfirm: true })
    if (!isEdit)
      mixpanelHandler(MIXPANEL_TYPE.LO_CLICK_REVIEW_PLACE_ORDER, {
        from_token: currencyIn.symbol,
        to_token: currencyOut.symbol,
        from_network: chainId,
        trade_qty: inputAmount,
      })
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
      mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'choose date')
    } else {
      setCustomDateExpire(val)
    }
  }

  const getActiveMakingAmount = useCallback(
    async (currencyIn: Currency) => {
      try {
        const address = currencyIn?.wrapped.address
        if (!address || !account) return
        const { activeMakingAmount } = await getTotalActiveMakingAmount(chainId, address, account)
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
    refreshActiveMakingAmount()
  }

  const handleError = useCallback(
    (error: any) => {
      setFlowState(state => ({
        ...state,
        attemptingTxn: false,
        errorMessage: getErrorMessage(error),
      }))
    },
    [setFlowState],
  )

  const signOrder = async (params: CreateOrderParam) => {
    const { currencyIn, currencyOut, inputAmount, outputAmount, signature, salt } = params
    if (signature && salt) return { signature, salt }
    if (!library || !currencyIn || !currencyOut) return { signature: '', salt: '' }

    const payload = getPayloadCreateOrder(params)
    setFlowState(state => ({
      ...state,
      attemptingTxn: true,
      pendingText: `Sign limit order: ${formatAmountOrder(inputAmount)} ${currencyIn.symbol} to ${formatAmountOrder(
        outputAmount,
      )} ${currencyOut.symbol}`,
    }))
    const messagePayload = await getMessageSignature(payload)

    const rawSignature = await library.send('eth_signTypedData_v4', [account, JSON.stringify(messagePayload)])

    const bytes = ethers.utils.arrayify(rawSignature)
    const lastByte = bytes[64]
    if (lastByte === 0 || lastByte === 1) {
      // to support hardware wallet https://ethereum.stackexchange.com/a/113727
      bytes[64] += 27
    }

    return { signature: ethers.utils.hexlify(bytes), salt: messagePayload?.message?.salt }
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

      const { signature, salt } = await signOrder(params)
      const payload = getPayloadCreateOrder(params)
      setFlowState(state => ({ ...state, pendingText: t`Placing order` }))
      const response = await submitOrder({ ...payload, salt, signature })
      setFlowState(state => ({ ...state, showConfirm: false }))
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order Placed`,
          summary: (
            <Text color={theme.text} lineHeight="18px">
              <Trans>
                You have successfully placed an order to pay{' '}
                <Text as="span" fontWeight={500}>
                  {formatAmountOrder(inputAmount)} {currencyIn.symbol}
                </Text>{' '}
                and receive{' '}
                <Text as="span" fontWeight={500}>
                  {formatAmountOrder(outputAmount)} {currencyOut.symbol}{' '}
                </Text>
                <Text as="span" color={theme.subText}>
                  at {currencyIn.symbol} price of {calcRate(inputAmount, outputAmount, currencyOut.decimals)}{' '}
                  {currencyOut.symbol}.
                </Text>
              </Trans>
            </Text>
          ),
        },
        10000,
      )
      onResetForm()
      setTimeout(() => refreshListOrder?.(), 500)
      return response?.id
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
        const { signature, salt } = await signOrder(param)
        setCurrentOrder({ ...param, salt, signature })
      }
      onDismissModalEdit?.()
    } catch (error) {
      orderInfo && removeCurrentOrder(orderInfo.id)
      handleError(error)
    }
  }

  const onWrapToken = async () => {
    try {
      if (isNotFillAllInput || wrapInputError || isWrappingEth || hasInputError) return
      const amount = formatAmountOrder(inputAmount)
      setFlowState(state => ({
        ...state,
        attemptingTxn: true,
        showConfirm: true,
        pendingText: t`Wrapping ${amount} ${currencyIn?.symbol} to ${amount} ${WETH[chainId].symbol}`,
      }))
      const hash = await onWrap?.()
      hash && setTxHashWrapped(hash)
      setFlowState(state => ({ ...state, showConfirm: false }))
    } catch (error) {
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
      debounce(() => {
        clearCacheActiveMakingAmount()
        if (currencyIn) {
          getActiveMakingAmount(currencyIn)
        }
      }, 100),
    [currencyIn, getActiveMakingAmount],
  )

  const isInit = useRef(false)
  useEffect(() => {
    if (isInit.current && currencyIn) getActiveMakingAmount(currencyIn) // skip the first time
    isInit.current = true
  }, [currencyIn, getActiveMakingAmount, isEdit])

  // use ref to prevent too many api call when firebase update status
  const refSubmitCreateOrder = useRef(onSubmitCreateOrder)
  refSubmitCreateOrder.current = onSubmitCreateOrder
  const refRefreshActiveMakingAmount = useRef(refreshActiveMakingAmount)
  refRefreshActiveMakingAmount.current = refreshActiveMakingAmount

  useEffect(() => {
    if (!account || !chainId) return
    // call when cancel expired/cancelled
    const unsubscribeCancelled = subscribeNotificationOrderCancelled(account, chainId, data => {
      data?.orders.forEach(order => {
        const findInfo = ordersUpdating.find(e => e.orderId === order.id)
        if (!findInfo?.orderId) return
        removeCurrentOrder(findInfo.orderId)
        if (order.isSuccessful) refSubmitCreateOrder.current(findInfo)
      })
      refRefreshActiveMakingAmount.current()
    })
    const unsubscribeExpired = subscribeNotificationOrderExpired(account, chainId, refRefreshActiveMakingAmount.current)
    return () => {
      unsubscribeCancelled?.()
      unsubscribeExpired?.()
    }
  }, [account, chainId, ordersUpdating, removeCurrentOrder])

  useEffect(() => {
    if (inputAmountGlobal) onSetInput(inputAmountGlobal)
  }, [inputAmountGlobal, onSetInput]) // when redux state change, ex: type and swap

  useEffect(() => {
    return () => {
      resetState()
    }
  }, [resetState])

  const trackingTouchInput = useCallback(() => {
    mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'touch enter amount box')
  }, [mixpanelHandler])

  const trackingTouchSelectToken = useCallback(() => {
    mixpanelHandler(MIXPANEL_TYPE.LO_ENTER_DETAIL, 'touch enter token box')
  }, [mixpanelHandler])

  const trackingPlaceOrder = (type: MIXPANEL_TYPE, data = {}) => {
    mixpanelHandler(type, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      from_network: networkInfo.name,
      trade_qty: inputAmount,
      ...data,
    })
  }

  const onSubmitCreateOrderWithTracking = async () => {
    trackingPlaceOrder(MIXPANEL_TYPE.LO_CLICK_PLACE_ORDER)
    const order_id = await onSubmitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
    })
    if (order_id) trackingPlaceOrder(MIXPANEL_TYPE.LO_PLACE_ORDER_SUCCESS, { order_id })
  }

  const styleTooltip = { maxWidth: '250px', zIndex: zIndexToolTip }
  const estimateUSD = useMemo(() => {
    return calcUsdPrices({
      inputAmount,
      outputAmount,
      priceUsdIn: tradeInfo?.amountInUsd,
      priceUsdOut: tradeInfoInvert?.amountInUsd,
      currencyIn,
      currencyOut,
    })
  }, [inputAmount, outputAmount, tradeInfo, tradeInfoInvert, currencyIn, currencyOut])

  const showApproveFlow =
    !checkingAllowance &&
    !showWrap &&
    !isNotFillAllInput &&
    !hasInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      !enoughAllowance ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const showWarningRate = Boolean(currencyIn && displayRate && !deltaRate.profit && deltaRate.percent)

  return (
    <>
      <Flex flexDirection={'column'} style={{ gap: '1rem' }}>
        <Tooltip text={inputError} show={!!inputError} placement="top" style={styleTooltip} width="fit-content">
          <CurrencyInputPanel
            maxLength={16}
            error={!!inputError}
            value={inputAmount}
            positionMax="top"
            onUserInput={onSetInput}
            onMax={handleMaxInput}
            onHalf={null}
            otherCurrency={currencyOut}
            estimatedUsd={estimateUSD.input}
            onFocus={trackingTouchInput}
            onCurrencySelect={handleInputSelect}
            currency={currencyIn}
            showCommonBases
            id="create-limit-order-input-tokena"
            maxCurrencySymbolLength={6}
            filterWrap
            onClickSelect={trackingTouchSelectToken}
            lockIcon={showApproveFlow}
            label={
              <Label>
                <Trans>You Pay</Trans>
              </Label>
            }
            positionLabel="in"
          />
        </Tooltip>

        <RowBetween gap="1rem">
          <InputWrapper>
            <Flex justifyContent={'space-between'} alignItems="center">
              <DeltaRate symbolIn={currencyIn?.symbol ?? ''} marketPrice={tradeInfo?.price} rateInfo={rateInfo} />
              <Set2Market onClick={setPriceRateMarket}>
                <Trans>Market</Trans>
              </Set2Market>
            </Flex>
            <Flex alignItems={'center'} style={{ background: theme.buttonBlack, borderRadius: 12 }}>
              <NumericalInput
                maxLength={16}
                style={{ fontSize: 14, height: INPUT_HEIGHT }}
                value={displayRate}
                onUserInput={onChangeRate}
                onFocus={trackingTouchInput}
              />
              {currencyIn && currencyOut && (
                <Flex style={{ gap: 6, cursor: 'pointer' }} onClick={() => onInvertRate(!rateInfo.invert)}>
                  <CurrencyLogo size={'18px'} currency={rateInfo.invert ? currencyIn : currencyOut} />
                  <Text fontSize={14} color={theme.subText}>
                    {rateInfo.invert ? currencyIn?.symbol : currencyOut?.symbol}
                  </Text>
                  <div>
                    <Repeat color={theme.subText} size={12} />
                  </div>
                </Flex>
              )}
            </Flex>
          </InputWrapper>
          <InputWrapper style={{ maxWidth: '30%' }}>
            <Label>
              <Trans>Expires In</Trans>
            </Label>
            <Select
              value={expire}
              onChange={onChangeExpire}
              optionStyle={isEdit ? { paddingTop: 8, paddingBottom: 8 } : {}}
              menuStyle={isEdit ? { paddingTop: 8, paddingBottom: 8 } : {}}
              style={{ width: '100%', padding: 0, height: INPUT_HEIGHT }}
              options={[...EXPIRED_OPTIONS, { label: 'Custom', onSelect: toggleDatePicker }]}
              activeRender={item => (
                <Text color={theme.text} fontSize={14}>
                  {customDateExpire ? dayjs(customDateExpire).format('DD/MM/YYYY HH:mm') : item?.label}
                </Text>
              )}
            />
          </InputWrapper>
        </RowBetween>

        <RowBetween>
          <TradePrice
            price={tradeInfo?.price}
            style={{ width: 'fit-content', fontStyle: 'italic' }}
            color={theme.text}
            label={t`Market Price is`}
          />
          <ArrowRotate
            rotate={rotate}
            onClick={isEdit ? undefined : handleRotateClick}
            style={{ width: 25, height: 25, padding: 4, background: theme.buttonGray }}
          />
        </RowBetween>

        <Tooltip text={outPutError} show={!!outPutError} placement="top" style={styleTooltip} width="fit-content">
          <CurrencyInputPanel
            maxLength={16}
            value={outputAmount}
            error={!!outPutError}
            currency={currencyOut}
            onUserInput={onSetOutput}
            otherCurrency={currencyOut}
            onMax={null}
            onHalf={null}
            estimatedUsd={estimateUSD.output}
            onFocus={trackingTouchInput}
            id="create-limit-order-input-tokenb"
            onCurrencySelect={handleOutputSelect}
            positionMax="top"
            showCommonBases
            maxCurrencySymbolLength={6}
            filterWrap
            onClickSelect={trackingTouchSelectToken}
            label={
              <Label>
                <Trans>You Receive</Trans>
              </Label>
            }
            positionLabel="in"
          />
        </Tooltip>

        {chainId !== ChainId.ETHW && <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} />}

        {showWarningRate && (
          <ErrorWarningPanel
            type="error"
            title={t`Limit order price is ${deltaRate.percent} lower than the market. You will be selling your ${currencyIn?.symbol} exceedingly cheap.`}
          />
        )}

        <ActionButtonLimitOrder
          {...{
            currencyIn,
            approval,
            showWrap,
            isWrappingEth,
            isNotFillAllInput,
            approvalSubmitted,
            hasInputError,
            enoughAllowance,
            checkingAllowance,
            wrapInputError,
            approveCallback,
            onWrapToken,
            showPreview,
            showApproveFlow,
            showWarningRate,
          }}
        />
      </Flex>

      <ConfirmOrderModal
        flowState={flowState}
        onDismiss={hidePreview}
        onSubmit={isEdit ? onSubmitEditOrder : onSubmitCreateOrderWithTracking}
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
