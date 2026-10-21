import { Flex, Text, TouchableArea, zIndexes } from '@universe/mycelium'
import { ENTER_PRESET_CLASSES, EXIT_PRESET_CLASSES } from '@universe/mycelium/compat'
import { ReceiptText } from '@universe/mycelium/icons/ReceiptText'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { Presence, type PresenceExitProps } from '@universe/mycelium/presence'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { isImpersonatedAccount } from 'src/app/features/accounts/impersonation'
import { rejectAllRequests } from 'src/app/features/dappRequests/actions'
import { TransactionConfirmationTrackerProvider } from 'src/app/features/dappRequests/context/TransactionConfirmationTracker'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { DappRequestCards } from 'src/app/features/dappRequests/DappRequestQueueCards'
import {
  DappRequestQueueProvider,
  useDappRequestQueueContext,
} from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ConnectionRequestContent } from 'src/app/features/dappRequests/requestContent/Connection/ConnectionRequestContent'
import { EthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/EthSend'
import { ImpersonatingCannotSignContent } from 'src/app/features/dappRequests/requestContent/Impersonating/ImpersonatingCannotSignContent'
import { PersonalSignRequestContent } from 'src/app/features/dappRequests/requestContent/PersonalSign/PersonalSignRequestContent'
import { SendCallsRequestHandler } from 'src/app/features/dappRequests/requestContent/SendCalls/SendCallsRequestContent'
import { SignTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/SignTypedDataRequestContent'
import { requestRequiresSignature } from 'src/app/features/dappRequests/requestRequiresSignature'
import {
  isDappRequestStoreItemForEthSendTxn,
  isDappRequestStoreItemForSendCallsTxn,
  selectAllDappRequests,
} from 'src/app/features/dappRequests/slice'
import {
  isConnectionRequest,
  isSignMessageRequest,
  isSignTypedDataRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Trans } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const REJECT_MESSAGE_HEIGHT = 48

/**
 * Exit presentation for the outgoing request-count pane (legacy semantics of
 * DappRequestContent's `AnimatedPane` `increasing` variant): the outgoing
 * number slides down and fades only when the count is decreasing; on an
 * increasing count it swaps out instantly.
 */
function getCountExitProps(custom: { increasing: boolean } | undefined): PresenceExitProps {
  return custom?.increasing === false ? { className: EXIT_PRESET_CLASSES.fadeOutDown } : {}
}

export function DappRequestQueue(): JSX.Element {
  const dappRequests = useSelector(selectAllDappRequests)
  const requestsExist = dappRequests.length > 0

  return (
    <Modal
      alignment="top"
      backgroundColor="$transparent"
      borderWidth={0}
      isModalOpen={requestsExist}
      name={ModalName.DappRequest}
      padding="$none"
      zIndex={zIndexes.overlay}
    >
      <TransactionConfirmationTrackerProvider>
        <DappRequestQueueProvider>
          <DappRequestQueueContent />
        </DappRequestQueueProvider>
      </TransactionConfirmationTrackerProvider>
    </Modal>
  )
}

function DappRequestQueueContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const { request, totalRequestCount, onPressPrevious, onPressNext, currentIndex, increasing } =
    useDappRequestQueueContext()

  const disabledPrevious = currentIndex <= 0
  const disabledNext = currentIndex >= totalRequestCount - 1

  const onRejectAll = async (): Promise<void> => {
    dispatch(rejectAllRequests())
  }

  return (
    <Flex>
      <Presence>
        {totalRequestCount > 1 && (
          <Flex
            row
            alignItems="center"
            animateEnterExit="fadeInDownOutUp"
            animation="200ms"
            backgroundColor="$surface1"
            borderRadius="$rounded16"
            gap="$spacing4"
            justifyContent="center"
            minHeight={REJECT_MESSAGE_HEIGHT}
            p="$spacing12"
          >
            <ReceiptText color="$neutral2" size="$icon.20" />
            <Flex grow>
              <Text color="$neutral2" variant="body4">
                <Trans
                  components={{
                    highlight: (
                      <Text
                        color="$neutral2"
                        opacity={1}
                        // `variant` prop must be first
                        variant="body4"
                        fontWeight="500"
                      />
                    ),
                  }}
                  i18nKey="dapp.request.reject.info"
                  values={{ totalRequestCount }}
                />
              </Text>
            </Flex>
            <TouchableArea onPress={onRejectAll}>
              <Text color="$statusCritical" fontWeight="500" variant="body4">
                {t('dapp.request.reject.action')}
              </Text>
            </TouchableArea>
          </Flex>
        )}
      </Presence>
      <Flex
        animation="200ms"
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        // compat `animation` is preset-only; the legacy 200ms margin change rides a scoped transition (never `transition: all` — theme-color flash)
        className="transition-[margin-top] duration-200 ease-out"
        gap="$spacing12"
        mt={totalRequestCount > 1 ? '$spacing12' : '$none'}
        width="100%"
        py="$spacing12"
      >
        {totalRequestCount > 1 && (
          <Flex
            row
            alignSelf="flex-start"
            backgroundColor="$surface2"
            borderRadius="$rounded8"
            justifyContent="center"
            p="$spacing4"
            position="absolute"
            right={12}
            zIndex={zIndexes.fixed}
          >
            <TouchableArea
              borderRadius="$rounded4"
              disabled={disabledPrevious}
              disabledStyle={{
                cursor: 'default',
              }}
              hoverStyle={{
                backgroundColor: colors.surface2Hovered.val,
              }}
              onPress={onPressPrevious}
            >
              <RotatableChevron color={disabledPrevious ? '$neutral3' : '$neutral2'} direction="left" size="$icon.16" />
            </TouchableArea>
            <Text color="$neutral2" variant="buttonLabel4">
              {currentIndex + 1}
            </Text>
            <Text color="$neutral2" mx="$spacing4" variant="buttonLabel4">
              /
            </Text>
            <Presence exitBeforeEnter custom={{ increasing }} initial={false} getExitProps={getCountExitProps}>
              {/* Incoming count fades in only while increasing — same preset-class pattern as the exit side above. */}
              <Flex key={totalRequestCount} className={increasing ? ENTER_PRESET_CLASSES.fadeIn : undefined}>
                <Text color="$neutral2" variant="buttonLabel4">
                  {totalRequestCount}
                </Text>
              </Flex>
            </Presence>
            <TouchableArea
              borderRadius="$rounded4"
              disabled={disabledNext}
              disabledStyle={{ cursor: 'default' }}
              hoverStyle={{
                backgroundColor: colors.surface2Hovered.val,
              }}
              onPress={onPressNext}
            >
              <RotatableChevron color={disabledNext ? '$neutral3' : '$neutral2'} direction="right" size="$icon.16" />
            </TouchableArea>
          </Flex>
        )}
        {/* Key by request id so switching requests remounts the content: per-request acknowledgement
            state (confirmedRisk) must not carry over to the next request, even one with an identical
            banner (e.g. two duplicate permanent scan failures). */}
        <DappRequest key={request?.dappRequest.requestId} />
      </Flex>
      <DappRequestCards />
    </Flex>
  )
}

const DappRequest = memo(function DappRequestInner(): JSX.Element | null {
  const { t } = useTranslation()
  const { request, currentAccount } = useDappRequestQueueContext()

  if (!request) {
    return null
  }

  // An impersonated wallet has no private key, so anything ending in a signature is refused up front
  // instead of rendering a review screen that looks approvable.
  if (isImpersonatedAccount(currentAccount) && requestRequiresSignature(request)) {
    return <ImpersonatingCannotSignContent />
  }

  if (isSignMessageRequest(request.dappRequest)) {
    return <PersonalSignRequestContent dappRequest={request.dappRequest} />
  }
  if (isSignTypedDataRequest(request.dappRequest)) {
    return <SignTypedDataRequestContent dappRequest={request.dappRequest} />
  }
  if (isDappRequestStoreItemForEthSendTxn(request)) {
    return <EthSendRequestContent request={request} />
  }
  if (isConnectionRequest(request.dappRequest)) {
    // Remount so selection / warning state doesn't carry across queued connect requests.
    return <ConnectionRequestContent key={request.dappRequest.requestId} />
  }
  if (isDappRequestStoreItemForSendCallsTxn(request)) {
    return <SendCallsRequestHandler request={request} />
  }

  return <DappRequestContent confirmText={t('common.button.confirm')} title={t('dapp.request.base.title')} />
})
