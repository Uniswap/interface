import { PropsWithChildren, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { NetworksFooter } from 'src/app/features/dappRequests/requestContent/NetworksFooter'
import { DappRequestStoreItem } from 'src/app/features/dappRequests/slice'
import { Anchor, AnimatePresence, Button, Flex, Text, UniversalImage, UniversalImageResizeMode, styled } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { useUSDValue } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { formatDappURL } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'
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
  isUniswapX?: boolean
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
  transactionGasFeeResult,
  children,
  isUniswapX,
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
        isUniswapX={isUniswapX}
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
  const hostname = extractNameFromUrl(dappUrl).toUpperCase()
  const fallbackIcon = <DappIconPlaceholder iconSize={iconSizes.icon40} name={hostname} />

  return (
    <Flex mb="$spacing4" ml="$spacing8" mt="$spacing8">
      <Flex row>
        <Flex grow>
          {headerIcon || (
            <UniversalImage
              style={{ image: { borderRadius: borderRadii.rounded8 } }}
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
  isUniswapX,
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
  const { balance: nativeBalance } = useOnChainNativeCurrencyBalance(currentChainId, currentAccount.address)

  const hasSufficientGas = hasSufficientFundsIncludingGas({
    gasFee: transactionGasFeeResult?.value,
    nativeCurrencyBalance: nativeBalance,
  })

  const shouldCloseSidebar = request.isSidebarClosed && totalRequestCount <= 1
  const isConfirmDisabled = transactionGasFeeResult ? !gasFeeUSD || !hasSufficientGas : false

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
        {!hasSufficientGas && (
          <Flex pb="$spacing8">
            <Text color="$DEP_accentWarning" variant="body3">
              {t('swap.warning.insufficientGas.title', {
                currencySymbol: nativeBalance?.currency?.symbol,
              })}
            </Text>
          </Flex>
        )}
        {showNetworkCost && (
          <NetworkFeeFooter
            chainId={currentChainId}
            gasFeeUSD={transactionGasFeeResult ? gasFeeUSD : '0'}
            isUniswapX={isUniswapX}
            showNetworkLogo={!!transactionGasFeeResult}
          />
        )}
        {showAllNetworks && <NetworksFooter />}
        <AddressFooter
          activeAccountAddress={activeAccount.address}
          connectedAccountAddress={connectedAccountAddress || currentAccount.address}
          px="$spacing8"
        />
        <Flex row gap="$spacing12" pt="$spacing8">
          <Button flex={1} flexBasis={1} size="small" theme="secondary" onPress={handleOnCancel}>
            {t('common.button.cancel')}
          </Button>
          <Button
            disabled={isConfirmDisabled}
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
