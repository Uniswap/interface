import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'
import { useDispatch } from 'react-redux'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { handleExternallySubmittedUniswapXOrder } from 'src/app/features/dappRequests/handleUniswapX'
import { useIsDappRequestConfirming } from 'src/app/features/dappRequests/hooks'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/shared'
import {
  DappRequest,
  isBatchedSwapRequest,
  isConnectionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import {
  Anchor,
  AnimatePresence,
  Button,
  Flex,
  GetThemeValueForKey,
  Text,
  UniversalImage,
  UniversalImageResizeMode,
  styled,
} from 'ui/src'
import { Verified } from 'ui/src/components/icons'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { UNISWAP_WEB_HOSTNAME } from 'uniswap/src/constants/urls'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestType } from 'uniswap/src/features/dappRequests/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { formatDappURL } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useThrottledCallback } from 'utilities/src/react/useThrottledCallback'
import { MAX_HIDDEN_CALLS_BY_DEFAULT } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'
import { WarningBox } from 'wallet/src/components/WarningBox/WarningBox'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface DappRequestHeaderProps {
  title: string
  headerIcon?: JSX.Element
}

interface DappRequestFooterProps {
  chainId?: UniverseChainId
  connectedAccountAddress?: string
  confirmText?: string
  maybeCloseOnConfirm?: boolean
  onCancel?: (requestToConfirm?: DappRequestStoreItem, transactionTypeInfo?: TransactionTypeInfo) => void
  onConfirm?: (requestToCancel?: DappRequestStoreItem) => void
  showAllNetworks?: boolean
  showNetworkCost?: boolean
  showSmartWalletActivation?: boolean
  transactionGasFeeResult?: GasFeeResult
  isUniswapX?: boolean
  disableConfirm?: boolean
  contentHorizontalPadding?: number | Animated.AnimatedNode | GetThemeValueForKey<'paddingHorizontal'> | null
}

type DappRequestContentProps = DappRequestHeaderProps & DappRequestFooterProps

export const AnimatedPane = styled(Flex, {
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
  showSmartWalletActivation,
  transactionGasFeeResult,
  children,
  isUniswapX,
  disableConfirm,
  contentHorizontalPadding = '$spacing12',
}: PropsWithChildren<DappRequestContentProps>): JSX.Element {
  const { forwards, currentIndex } = useDappRequestQueueContext()

  return (
    <>
      <DappRequestHeader headerIcon={headerIcon} title={title} />
      <AnimatePresence exitBeforeEnter custom={{ forwards }}>
        <AnimatedPane key={currentIndex} animation="200ms" px={contentHorizontalPadding}>
          {children}
        </AnimatedPane>
      </AnimatePresence>
      <DappRequestFooter
        chainId={chainId}
        confirmText={confirmText}
        connectedAccountAddress={connectedAccountAddress}
        isUniswapX={isUniswapX}
        maybeCloseOnConfirm={maybeCloseOnConfirm}
        showAllNetworks={showAllNetworks}
        showNetworkCost={showNetworkCost}
        showSmartWalletActivation={showSmartWalletActivation}
        transactionGasFeeResult={transactionGasFeeResult}
        disableConfirm={disableConfirm}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </>
  )
}

function DappRequestHeader({ headerIcon, title }: DappRequestHeaderProps): JSX.Element {
  const { dappIconUrl, dappUrl, request } = useDappRequestQueueContext()
  const hostname = extractNameFromUrl(dappUrl).toUpperCase()
  const fallbackIcon = <DappIconPlaceholder iconSize={iconSizes.icon40} name={hostname} />
  const showVerified =
    request && isConnectionRequest(request.dappRequest) && formatDappURL(dappUrl) === UNISWAP_WEB_HOSTNAME

  return (
    <Flex mb="$spacing4" ml="$spacing8" mt="$spacing8" px="$spacing12">
      <Flex row>
        <Flex borderRadius="$roundedFull" borderWidth="$spacing1" borderColor="$surface3">
          {headerIcon || (
            <UniversalImage
              style={{
                image: { borderRadius: borderRadii.roundedFull },
              }}
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
        <Flex row alignItems="center" mt="$spacing4" gap="$gap4">
          <Text color="$accent1" textAlign="left" variant="body4">
            {formatDappURL(dappUrl)}
          </Text>
          {showVerified && <Verified color="$accent1" size="$icon.12" />}
        </Flex>
      </Anchor>
    </Flex>
  )
}

const WINDOW_CLOSE_DELAY = 10

function DappRequestFooter({
  chainId,
  connectedAccountAddress,
  confirmText,
  maybeCloseOnConfirm,
  onCancel,
  onConfirm,
  showNetworkCost,
  showSmartWalletActivation,
  transactionGasFeeResult,
  isUniswapX,
  disableConfirm,
}: DappRequestFooterProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const { defaultChainId } = useEnabledChains()
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

  const sendTransactionChainId =
    request.dappRequest.type === DappRequestType.SendTransaction ? request.dappRequest.transaction.chainId : undefined
  const currentChainId = chainId || sendTransactionChainId || activeChain || defaultChainId
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(currentChainId, currentAccount.address)
  const isRequestConfirming = useIsDappRequestConfirming(request.dappRequest.requestId)

  const hasSufficientGas = hasSufficientFundsIncludingGas({
    gasFee: transactionGasFeeResult?.value,
    nativeCurrencyBalance: nativeBalance,
  })

  const shouldCloseSidebar = request.isSidebarClosed && totalRequestCount <= 1

  // Disable submission if no gas fee value
  const isConfirmEnabled =
    request.dappRequest.type === DappRequestType.SendTransaction
      ? transactionGasFeeResult?.value && hasSufficientGas
      : true

  const handleOnConfirm = useEvent(async () => {
    if (isRequestConfirming) {
      return
    }

    if (onConfirm) {
      onConfirm()
    } else {
      await defaultOnConfirm({ request })
      if (isUniswapX) {
        await handleExternallySubmittedUniswapXOrder(activeAccount.address, dispatch)
      }
    }

    if (maybeCloseOnConfirm && shouldCloseSidebar) {
      setTimeout(window.close, WINDOW_CLOSE_DELAY)
    }
  })

  // This is strictly a UI debounce to prevent submitting the same confirmation multiple times.
  const [debouncedHandleOnConfirm, isConfirming] = useThrottledCallback(handleOnConfirm)

  const handleOnCancel = useEvent(async () => {
    if (onCancel) {
      onCancel()
    } else {
      await defaultOnCancel(request)
    }

    if (shouldCloseSidebar) {
      setTimeout(window.close, WINDOW_CLOSE_DELAY)
    }
  })

  const isDisabled = !isConfirmEnabled || disableConfirm || isConfirming || isRequestConfirming
  const isLoading = isRequestConfirming || isConfirming

  return (
    <>
      <Flex gap="$spacing8" mt="$spacing8" px="$spacing12">
        {!hasSufficientGas && (
          <Flex pb="$spacing8">
            <Text color="$statusWarning" variant="body3">
              {t('swap.warning.insufficientGas.title', {
                currencySymbol: nativeBalance?.currency.symbol ?? '',
              })}
            </Text>
          </Flex>
        )}
        {showNetworkCost && (
          <NetworkFeeFooter
            chainId={currentChainId}
            gasFee={transactionGasFeeResult}
            isUniswapX={isUniswapX}
            showNetworkLogo={!!transactionGasFeeResult}
            requestMethod={request.dappRequest.type}
            showSmartWalletActivation={showSmartWalletActivation}
          />
        )}
        <AddressFooter
          activeAccountAddress={activeAccount.address}
          connectedAccountAddress={connectedAccountAddress || currentAccount.address}
          px="$spacing8"
        />
        <WarningSection request={request.dappRequest} />
        <Flex row gap="$spacing12" pt="$spacing8">
          <Button flexBasis={1} size="medium" emphasis="secondary" onPress={handleOnCancel}>
            {t('common.button.cancel')}
          </Button>
          {confirmText && (
            <Button
              isDisabled={isDisabled}
              loading={isLoading}
              flexBasis={1}
              size="medium"
              variant="branded"
              onPress={debouncedHandleOnConfirm}
            >
              {confirmText}
            </Button>
          )}
        </Flex>
      </Flex>
    </>
  )
}

function WarningSection({ request }: { request: DappRequest }) {
  const { t } = useTranslation()

  if (request.type === DappRequestType.SendCalls) {
    if (request.calls.length <= 1 || isBatchedSwapRequest(request)) {
      return null
    }
    const level = request.calls.length >= MAX_HIDDEN_CALLS_BY_DEFAULT ? 'critical' : 'warning'
    return <WarningBox level={level} message={t('walletConnect.request.warning.batch.message')} />
  }
}
