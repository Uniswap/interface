import { toUtf8String } from '@ethersproject/strings'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SignMessageRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, IconButton, Text, Tooltip } from 'ui/src'
import { AlertTriangleFilled, Code, StickyNoteTextSquare } from 'ui/src/components/icons'
import { zIndexes } from 'ui/src/theme'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { logger } from 'utilities/src/logger/logger'
import { containsNonPrintableChars } from 'utilities/src/primitives/string'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappPersonalSignContent } from 'wallet/src/components/dappRequests/DappPersonalSignContent'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

enum ViewEncoding {
  UTF8 = 0,
  HEX = 1,
}
interface PersonalSignRequestProps {
  dappRequest: SignMessageRequest
}

export function PersonalSignRequestContent({ dappRequest }: PersonalSignRequestProps): JSX.Element | null {
  const blockaidTransactionScanning = useFeatureFlag(FeatureFlags.BlockaidTransactionScanning)

  // Decode message to UTF-8
  const hexMessage = dappRequest.messageHex
  const [utf8Message, setUtf8Message] = useState<string | undefined>()

  useEffect(() => {
    try {
      const decodedMessage = toUtf8String(hexMessage)
      setUtf8Message(decodedMessage)
    } catch {
      // If the message is not valid UTF-8, we'll show the hex message instead
      setUtf8Message(undefined)
    }
  }, [hexMessage])

  if (blockaidTransactionScanning) {
    return <PersonalSignRequestContentWithScanning dappRequest={dappRequest} utf8Message={utf8Message} />
  }

  return <PersonalSignRequestContentLegacy dappRequest={dappRequest} utf8Message={utf8Message} />
}

/**
 * Implementation with Blockaid scanning
 */
function PersonalSignRequestContentWithScanning({
  dappRequest,
  utf8Message,
}: {
  dappRequest: SignMessageRequest
  utf8Message: string | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const activeChain = useDappLastChainId(dappUrl)
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  const hexMessage = dappRequest.messageHex
  const isDecoded = Boolean(utf8Message && !containsNonPrintableChars(utf8Message))
  const message = (isDecoded ? utf8Message : hexMessage) || hexMessage
  const hasLoggedError = useRef(false)

  if (!activeChain) {
    if (!hasLoggedError.current) {
      logger.error(new Error('No active chain found'), {
        tags: { file: 'PersonalSignRequestContent', function: 'PersonalSignRequestContentWithScanning' },
      })
      hasLoggedError.current = true
    }
    return <PersonalSignRequestContentLegacy dappRequest={dappRequest} utf8Message={utf8Message} />
  }

  const disableConfirm = shouldDisableConfirm({ riskLevel, confirmedRisk })

  return (
    <DappRequestContent
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
      showAddressFooter={false}
      disableConfirm={disableConfirm}
    >
      <DappPersonalSignContent
        chainId={activeChain}
        account={currentAccount.address}
        message={message}
        isDecoded={isDecoded}
        method={EthMethod.PersonalSign}
        params={[hexMessage, currentAccount.address]}
        dappUrl={dappUrl}
        confirmedRisk={confirmedRisk}
        onConfirmRisk={setConfirmedRisk}
        onRiskLevelChange={setRiskLevel}
      />
    </DappRequestContent>
  )
}

/**
 * Legacy implementation (existing behavior when feature flag is off)
 */
function PersonalSignRequestContentLegacy({
  dappRequest,
  utf8Message,
}: {
  dappRequest: SignMessageRequest
  utf8Message: string | undefined
}): JSX.Element {
  const { t } = useTranslation()

  const [viewEncoding, setViewEncoding] = useState(ViewEncoding.UTF8)

  const toggleViewEncoding = (): void =>
    setViewEncoding(viewEncoding === ViewEncoding.UTF8 ? ViewEncoding.HEX : ViewEncoding.UTF8)

  const hexMessage = dappRequest.messageHex
  const containsUnrenderableCharacters = !utf8Message || containsNonPrintableChars(utf8Message)

  useEffect(() => {
    if (!utf8Message) {
      setViewEncoding(ViewEncoding.HEX)
    }
  }, [utf8Message])

  const [isScrollable, setIsScrollable] = useState(false)
  const messageRef = useRef<HTMLElement>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: viewEncoding and utf8Message affect rendered content which changes scroll height
  useEffect(() => {
    const checkScroll = (): void => {
      if (!messageRef.current) {
        return
      }
      setIsScrollable(messageRef.current.scrollHeight > messageRef.current.clientHeight)
    }

    checkScroll()
    window.addEventListener('resize', checkScroll)

    return () => window.removeEventListener('resize', checkScroll)
  }, [viewEncoding, utf8Message])

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
    >
      <Flex
        ref={messageRef}
        $platform-web={{ overflowY: 'auto' }}
        alignItems="flex-start"
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        flexDirection="row"
        justifyContent="space-between"
        maxHeight={200}
        minHeight="$spacing48"
        p="$spacing16"
        position="relative"
      >
        <Text color="$neutral2" maxWidth="calc(100% - 36px)" variant="body4">
          {viewEncoding === ViewEncoding.UTF8 ? utf8Message : hexMessage}
        </Text>
      </Flex>
      <Tooltip allowFlip stayInFrame delay={100} placement="left">
        <Flex
          alignSelf="flex-end"
          bottom="$spacing16"
          position="absolute"
          right={isScrollable ? '$spacing24' : '$spacing12'}
        >
          <Tooltip.Trigger>
            <IconButton
              icon={viewEncoding === ViewEncoding.UTF8 ? <Code /> : <StickyNoteTextSquare />}
              size="xxsmall"
              variant="default"
              emphasis="secondary"
              onPress={toggleViewEncoding}
            />
          </Tooltip.Trigger>
        </Flex>
        <Tooltip.Content animationDirection="left" zIndex={zIndexes.overlay}>
          <Tooltip.Arrow />
          <Text variant="body4">
            {viewEncoding === ViewEncoding.UTF8
              ? t('dapp.request.signature.toggleDataView.raw')
              : t('dapp.request.signature.toggleDataView.readable')}
          </Text>
        </Tooltip.Content>
      </Tooltip>
      {containsUnrenderableCharacters && (
        <Flex
          alignItems="center"
          backgroundColor="$surface2"
          borderColor="$surface3"
          borderRadius="$rounded16"
          flexDirection="row"
          gap="$spacing8"
          justifyContent="flex-start"
          mt="$spacing12"
          p="$spacing12"
        >
          <AlertTriangleFilled color="$neutral2" minWidth="$spacing20" size="$icon.20" />
          <Text color="$neutral2" variant="body4">
            {t('dapp.request.signature.containsUnrenderableCharacters')}
          </Text>
        </Flex>
      )}
    </DappRequestContent>
  )
}
