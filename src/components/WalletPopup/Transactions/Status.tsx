import { t } from '@lingui/macro'
import axios from 'axios'
import { debounce } from 'lodash'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Repeat } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Flex } from 'rebass'

import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import WarningIcon from 'components/Icons/WarningIcon'
import Loader from 'components/Loader'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { isTxsPendingTooLong as isShowPendingWarning } from 'components/WalletPopup/Transactions/helper'
import { CancellingOrderInfo } from 'components/swapv2/LimitOrder/useCancellingOrders'
import { KS_SETTING_API } from 'constants/env'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'
import useTheme from 'hooks/useTheme'
import { AppDispatch } from 'state'
import { modifyTransaction } from 'state/transactions/actions'
import { TRANSACTION_TYPE, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

const MAX_TIME_CHECK_STATUS = 7 * 86_400_000 // the time that we don't need to interval check
const TYPE_NEED_CHECK_PENDING = [TRANSACTION_TYPE.CANCEL_LIMIT_ORDER, TRANSACTION_TYPE.BRIDGE]
const TYPE_INTERVAL = [TRANSACTION_TYPE.BRIDGE]

const isTxsActuallySuccess = (txs: TransactionDetails) => txs.extraInfo?.actuallySuccess

// this component to interval call api/listen firebase to check transaction status actually done or not
function StatusIcon({
  transaction,
  cancellingOrderInfo,
}: {
  transaction: TransactionDetails
  cancellingOrderInfo: CancellingOrderInfo
}) {
  const { type, hash, extraInfo, chainId, addedTime } = transaction
  const { pending: pendingRpc, success } = getTransactionStatus(transaction)

  const needCheckActuallyPending =
    success &&
    TYPE_NEED_CHECK_PENDING.includes(type) &&
    !isTxsActuallySuccess(transaction) &&
    Date.now() - addedTime < MAX_TIME_CHECK_STATUS

  const isPendingTooLong = isShowPendingWarning(transaction)
  const [isPendingState, setIsPendingState] = useState<boolean | null>(null)

  const dispatch = useDispatch<AppDispatch>()
  const { cancellingOrdersIds, cancellingOrdersNonces, loading } = cancellingOrderInfo

  const pending = isPendingState

  const interval = useRef<NodeJS.Timeout>()

  const checkStatus = useCallback(async () => {
    try {
      if (isTxsActuallySuccess(transaction) && interval.current) {
        clearInterval(interval.current)
        return
      }

      let isPending = false
      const isLoadingRemoteData = type === TRANSACTION_TYPE.CANCEL_LIMIT_ORDER && loading
      switch (type) {
        case TRANSACTION_TYPE.CANCEL_LIMIT_ORDER:
          const orderId = extraInfo?.arbitrary?.order_id
          isPending = cancellingOrdersIds.includes(orderId) || cancellingOrdersNonces.length > 0
          break
        case TRANSACTION_TYPE.BRIDGE: {
          const { data: response } = await axios.get(`${KS_SETTING_API}/v1/multichain-transfers/${hash}`)
          isPending = response?.data?.status === MultichainTransferStatus.Processing
          break
        }
      }
      if (!isPending && !isLoadingRemoteData) {
        dispatch(
          modifyTransaction({
            chainId,
            hash,
            extraInfo: { ...extraInfo, actuallySuccess: true },
          }),
        )
      }
      setIsPendingState(isPending)
    } catch (error) {
      console.error('Checking txs status error: ', error)
      interval.current && clearInterval(interval.current)
    }
  }, [cancellingOrdersIds, cancellingOrdersNonces, chainId, dispatch, transaction, extraInfo, hash, type, loading])

  const checkStatusDebounced = useMemo(() => debounce(checkStatus, 1000), [checkStatus])

  useEffect(() => {
    if (!needCheckActuallyPending) {
      setIsPendingState(pendingRpc)
      return
    }
    checkStatusDebounced()
    if (TYPE_INTERVAL.includes(type)) {
      interval.current = setInterval(checkStatusDebounced, 5000)
    }
    return () => interval.current && clearInterval(interval.current)
  }, [needCheckActuallyPending, pendingRpc, checkStatusDebounced, type])

  const theme = useTheme()
  const checkingStatus = pending === null

  const pendingText = isPendingTooLong ? t`Pending` : t`Processing`
  const pendingIcon = isPendingTooLong ? (
    <WarningIcon size={12} color={theme.red} solid />
  ) : (
    <Repeat size={14} color={theme.warning} />
  )
  return (
    <Flex style={{ gap: '4px', minWidth: 'unset' }} alignItems={'center'}>
      <PrimaryText color={theme.text}>
        {checkingStatus ? t`Checking` : pending ? pendingText : success ? t`Completed` : t`Failed`}
      </PrimaryText>
      {checkingStatus ? (
        <Loader size={'12px'} />
      ) : pending ? (
        pendingIcon
      ) : success ? (
        <CheckCircle size="12px" color={theme.primary} />
      ) : (
        <IconFailure size={15} color={theme.red} />
      )}
    </Flex>
  )
}
export default memo(StatusIcon)
