import { memo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatedPane, DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import {
  DappRequestQueueProvider,
  useDappRequestQueueContext,
} from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ConnectionRequestContent } from 'src/app/features/dappRequests/requestContent/Connection/ConnectionRequestContent'
import { EthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/EthSend'
import { PersonalSignRequestContent } from 'src/app/features/dappRequests/requestContent/PersonalSign/PersonalSignRequestContent'
import { SignTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/SignTypedDataRequestContent'
import { rejectAllRequests } from 'src/app/features/dappRequests/saga'
import { isDappRequestStoreItemForEthSendTxn } from 'src/app/features/dappRequests/slice'
import {
  isGetAccountRequest,
  isRequestAccountRequest,
  isRequestPermissionsRequest,
  isSignMessageRequest,
  isSignTypedDataRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { ExtensionState } from 'src/store/extensionReducer'
import { AnimatePresence, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ReceiptText, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes, zIndices } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const REJECT_MESSAGE_HEIGHT = 48

export function DappRequestQueue(): JSX.Element {
  const pendingDappRequests = useSelector((state: ExtensionState) => state.dappRequests.pending)
  const areRequestsPending = pendingDappRequests.length > 0

  return (
    <Modal
      alignment="top"
      backgroundColor="$transparent"
      isModalOpen={areRequestsPending}
      name={ModalName.DappRequest}
      padding="$none"
    >
      <DappRequestQueueProvider>
        <DappRequestQueueContent />
      </DappRequestQueueProvider>
    </Modal>
  )
}

function DappRequestQueueContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const { totalRequestCount, onPressPrevious, onPressNext, currentIndex, increasing } = useDappRequestQueueContext()

  const disabledPrevious = currentIndex <= 0
  const disabledNext = currentIndex >= totalRequestCount - 1

  const onRejectAll = async (): Promise<void> => {
    dispatch(rejectAllRequests())
  }

  return (
    <Flex>
      <AnimatePresence>
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
            <ReceiptText color="$neutral2" size={iconSizes.icon20} />
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
      </AnimatePresence>
      <Flex
        animation="200ms"
        backgroundColor="$surface1"
        borderRadius="$rounded24"
        gap="$spacing12"
        mb="$spacing12"
        p="$spacing12"
        top={totalRequestCount > 1 ? 12 : 0}
        width="100%"
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
            zIndex={zIndices.fixed}
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
              <RotatableChevron
                color={disabledPrevious ? '$neutral3' : '$neutral2'}
                direction="left"
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            </TouchableArea>
            <Text color="$neutral2" variant="buttonLabel4">
              {currentIndex + 1}
            </Text>
            <Text color="$neutral2" mx="$spacing4" variant="buttonLabel4">
              /
            </Text>
            <AnimatePresence exitBeforeEnter custom={{ increasing }} initial={false}>
              <AnimatedPane key={totalRequestCount} animation="200ms">
                <Text color="$neutral2" variant="buttonLabel4">
                  {totalRequestCount}
                </Text>
              </AnimatedPane>
            </AnimatePresence>
            <TouchableArea
              borderRadius="$rounded4"
              disabled={disabledNext}
              disabledStyle={{ cursor: 'default' }}
              hoverStyle={{
                backgroundColor: colors.surface2Hovered.val,
              }}
              onPress={onPressNext}
            >
              <RotatableChevron
                color={disabledNext ? '$neutral3' : '$neutral2'}
                direction="right"
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            </TouchableArea>
          </Flex>
        )}
        <DappRequest />
      </Flex>
    </Flex>
  )
}

const DappRequest = memo(function _DappRequest(): JSX.Element | null {
  const { t } = useTranslation()
  const { request } = useDappRequestQueueContext()

  if (!request) {
    return null
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
  if (
    isGetAccountRequest(request.dappRequest) ||
    isRequestAccountRequest(request.dappRequest) ||
    isRequestPermissionsRequest(request.dappRequest)
  ) {
    return <ConnectionRequestContent />
  }

  return <DappRequestContent confirmText={t('common.button.confirm')} title={t('dapp.request.base.title')} />
})
