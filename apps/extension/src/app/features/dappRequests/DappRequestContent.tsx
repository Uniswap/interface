import { PropsWithChildren, memo, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ConnectionRequestContent } from 'src/app/features/dappRequests/requestContent/Connection/ConnectionRequestContent'
import { EthSendRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/EthSend'
import { NetworksFooter } from 'src/app/features/dappRequests/requestContent/NetworksFooter'
import { PersonalSignRequestContent } from 'src/app/features/dappRequests/requestContent/PersonalSign/PersonalSignRequestContent'
import { SignTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/SignTypedDataRequestContent'
import { rejectAllRequests } from 'src/app/features/dappRequests/saga'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/slice'
import {
  isDappRequestStoreItemForEthSendTxn,
  isGetAccountRequest,
  isRequestAccountRequest,
  isRequestPermissionsRequest,
  isSignMessageRequest,
  isSignTypedDataRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { useAppDispatch } from 'src/store/store'
import {
  Anchor,
  AnimatePresence,
  Button,
  Flex,
  Text,
  TouchableArea,
  UniversalImage,
  UniversalImageResizeMode,
  styled,
  useSporeColors,
} from 'ui/src'
import { ReceiptText, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes, zIndices } from 'ui/src/theme'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { formatDappURL } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'
import { TransactionTypeInfo } from 'wallet/src/features/transactions/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface DappRequestHeaderProps {
  title: string
  headerIcon?: JSX.Element
}

interface DappRequestFooterProps {
  chainId?: WalletChainId
  connectedAccountAddress?: string
  confirmText: string
  maybeCloseOnConfirm?: boolean
  onCancel?: (requestToConfirm?: DappRequestStoreItem, transactionTypeInfo?: TransactionTypeInfo) => void
  onConfirm?: (requestToCancel?: DappRequestStoreItem) => void
  showAllNetworks?: boolean
  showNetworkCost?: boolean
  transactionGasFeeResult?: GasFeeResult
}

type DappRequestContentProps = DappRequestHeaderProps & DappRequestFooterProps

const REJECT_MESSAGE_HEIGHT = 48

const AnimatedPane = styled(Flex, {
  variants: {
    forwards: (dir: boolean) => ({
      enterStyle: {
        x: dir ? 10 : -10,
        opacity: 0,
      },
    }),
    increasing: (dir: boolean) => ({
      enterStyle: dir
        ? {
            y: 10,
            opacity: 0,
          }
        : undefined,
      exitStyle: !dir
        ? {
            y: 10,
            opacity: 0,
          }
        : undefined,
    }),
  } as const,
})

export function DappRequestWrapper(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const { totalRequestCount, onPressPrevious, onPressNext, currentIndex, increasing } = useDappRequestQueueContext()

  const disabledPrevious = currentIndex <= 0
  const disabledNext = currentIndex >= totalRequestCount - 1

  const onRejectAll = async (): Promise<void> => {
    dispatch(rejectAllRequests())
  }

  return (
    <BottomSheetModal alignment="top" backgroundColor="$transparent" name={ModalName.DappRequest} padding="$none">
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
                          variant="body4"
                          // `variant` prop must be first
                          // eslint-disable-next-line react/jsx-sort-props
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
          p="$spacing12"
          position="absolute"
          width="100%"
          y={totalRequestCount > 1 ? REJECT_MESSAGE_HEIGHT + 12 : 0}
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
    </BottomSheetModal>
  )
}

const DappRequest = memo(function _DappRequest(): JSX.Element {
  const { t } = useTranslation()
  const { request } = useDappRequestQueueContext()

  if (request) {
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
  }

  return <DappRequestContent confirmText={t('common.button.confirm')} title={t('dapp.request.base.title')} />
})

export function DappRequestContent({
  chainId,
  title,
  headerIcon,
  confirmText,
  connectedAccountAddress,
  maybeCloseOnConfirm,
  onCancel,
  onConfirm,
  showAllNetworks,
  showNetworkCost,
  transactionGasFeeResult,
  children,
}: PropsWithChildren<DappRequestContentProps>): JSX.Element {
  const { forwards, currentIndex } = useDappRequestQueueContext()

  return (
    <>
      <DappRequestHeader headerIcon={headerIcon} title={title} />
      <AnimatePresence exitBeforeEnter custom={{ forwards }}>
        <AnimatedPane key={currentIndex} animation="200ms">
          {children}
        </AnimatedPane>
      </AnimatePresence>
      <DappRequestFooter
        chainId={chainId}
        confirmText={confirmText}
        connectedAccountAddress={connectedAccountAddress}
        maybeCloseOnConfirm={maybeCloseOnConfirm}
        showAllNetworks={showAllNetworks}
        showNetworkCost={showNetworkCost}
        transactionGasFeeResult={transactionGasFeeResult}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </>
  )
}

function DappRequestHeader({ headerIcon, title }: DappRequestHeaderProps): JSX.Element {
  const { dappIconUrl, dappUrl } = useDappRequestQueueContext()
  const hostname = new URL(dappUrl).hostname.toUpperCase()
  const fallbackIcon = <DappIconPlaceholder iconSize={iconSizes.icon40} name={hostname} />

  return (
    <Flex mb="$spacing4" ml="$spacing8" mt="$spacing8">
      <Flex row>
        <Flex grow>
          {headerIcon || (
            <UniversalImage
              fallback={fallbackIcon}
              size={{
                width: iconSizes.icon40,
                height: iconSizes.icon40,
                resizeMode: UniversalImageResizeMode.Contain,
              }}
              uri={dappIconUrl}
            />
          )}
        </Flex>
      </Flex>
      <Text mt="$spacing8" variant="subheading1">
        {title}
      </Text>
      <Anchor href={dappUrl} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
        <Text color="$accent1" mt="$spacing4" textAlign="left" variant="body4">
          {formatDappURL(dappUrl)}
        </Text>
      </Anchor>
    </Flex>
  )
}

const WINDOW_CLOSE_DELAY = 10

export function DappRequestFooter({
  chainId,
  connectedAccountAddress,
  confirmText,
  maybeCloseOnConfirm,
  onCancel,
  onConfirm,
  showAllNetworks,
  showNetworkCost,
  transactionGasFeeResult,
}: DappRequestFooterProps): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()
  const {
    dappUrl,
    currentAccount,
    request,
    totalRequestCount,
    onConfirm: defaultOnConfirm,
    onCancel: defaultOnCancel,
  } = useDappRequestQueueContext()

  const activeChain = useDappLastChainId(dappUrl)

  if (!request) {
    const error = new Error('no request present')
    logger.error(error, { tags: { file: 'DappRequestContent', function: 'DappRequestFooter' } })
    throw error
  }

  const currentChainId = chainId || activeChain || UniverseChainId.Mainnet
  const gasFeeUSD = useUSDValue(currentChainId, transactionGasFeeResult?.value)

  const shouldCloseSidebar = request.isSidebarClosed && totalRequestCount <= 1

  const handleOnConfirm = useCallback(async () => {
    if (onConfirm) {
      onConfirm()
    } else {
      await defaultOnConfirm(request)
    }

    if (maybeCloseOnConfirm && shouldCloseSidebar) {
      setTimeout(window.close, WINDOW_CLOSE_DELAY)
    }
  }, [request, maybeCloseOnConfirm, onConfirm, defaultOnConfirm, shouldCloseSidebar])

  const handleOnCancel = useCallback(async () => {
    if (onCancel) {
      onCancel()
    } else {
      await defaultOnCancel(request)
    }

    if (shouldCloseSidebar) {
      setTimeout(window.close, WINDOW_CLOSE_DELAY)
    }
  }, [request, onCancel, defaultOnCancel, shouldCloseSidebar])

  return (
    <>
      <Flex gap="$spacing8" mt="$spacing8">
        {showNetworkCost && (
          <NetworkFeeFooter
            chainId={currentChainId}
            gasFeeUSD={transactionGasFeeResult ? gasFeeUSD : '0'}
            showNetworkLogo={!!transactionGasFeeResult}
          />
        )}
        {showAllNetworks && <NetworksFooter />}
        <AddressFooter
          activeAccountAddress={activeAccount.address}
          connectedAccountAddress={connectedAccountAddress || currentAccount.address}
        />
        <Flex row gap="$spacing12" pt="$spacing8">
          <Button flex={1} flexBasis={1} size="small" theme="secondary" onPress={handleOnCancel}>
            {t('common.button.cancel')}
          </Button>
          <Button
            disabled={transactionGasFeeResult ? !gasFeeUSD : false}
            flex={1}
            flexBasis={1}
            size="small"
            theme="primary"
            onPress={handleOnConfirm}
          >
            {confirmText}
          </Button>
        </Flex>
      </Flex>
    </>
  )
}
