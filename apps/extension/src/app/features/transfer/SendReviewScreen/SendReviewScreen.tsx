import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { SendDetails } from 'src/app/features/transfer/SendReviewScreen/SendDetails'
import { TransferScreen, useTransferContext } from 'src/app/features/transfer/TransferContext'
import { Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import {
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'wallet/src/features/transactions/transfer/hooks/useTransferCallback'

export function SendReviewScreen(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { navigateToAccountActivityList } = useWalletNavigation()

  const { derivedTransferInfo, warnings, txRequest, gasFee, setScreen } = useTransferContext()
  const { txId, chainId, recipient, currencyInInfo, currencyAmounts, nftIn } = derivedTransferInfo

  const triggerTransferPendingNotification = useCallback(() => {
    if (!currencyInInfo) {
      // This should never happen. Just keeping TS happy.
      logger.error(new Error('Missing `currencyInInfo` when triggering transfer pending notification'), {
        tags: { file: 'SendReviewScreen.tsx', function: 'triggerTransferPendingNotification' },
      })
    } else {
      dispatch(
        pushNotification({
          type: AppNotificationType.TransferCurrencyPending,
          currencyInfo: currencyInInfo,
        }),
      )
    }
  }, [currencyInInfo, dispatch])

  const onNext = useCallback((): void => {
    triggerTransferPendingNotification()
    navigateToAccountActivityList()
  }, [navigateToAccountActivityList, triggerTransferPendingNotification])

  const transferERC20Callback = useTransferERC20Callback(
    txId,
    chainId,
    recipient,
    currencyInInfo ? currencyAddress(currencyInInfo.currency) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onNext,
  )

  const transferNFTCallback = useTransferNFTCallback(
    txId,
    chainId,
    recipient,
    nftIn?.nftContract?.address,
    nftIn?.tokenId,
    txRequest,
    onNext,
  )

  const onTransfer = (): void => {
    nftIn ? transferNFTCallback?.() : transferERC20Callback?.()
  }

  const onPrev = (): void => {
    setScreen(TransferScreen.SendForm)
  }

  return (
    <Trace logImpression section={SectionName.TransferReview}>
      <Flex
        centered
        fill
        row
        alignItems="center"
        justifyContent="space-between"
        pb="$spacing12"
        pt="$spacing8"
        px="$spacing8"
      >
        <Text color="$neutral2" variant="body2">
          {t('send.review.modal.title')}
        </Text>
        <TouchableArea onPress={onPrev}>
          <X color="$neutral2" size="$icon.20" />
        </TouchableArea>
      </Flex>
      <SendDetails
        derivedTransferInfo={derivedTransferInfo}
        gasFee={gasFee}
        txRequest={txRequest}
        warnings={warnings}
        onReviewSubmit={onTransfer}
      />
    </Trace>
  )
}
