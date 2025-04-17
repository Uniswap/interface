import { toUtf8String } from '@ethersproject/strings'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { SignMessageRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, IconButton, Text, Tooltip } from 'ui/src'
import { AlertTriangleFilled, Code, StickyNoteTextSquare } from 'ui/src/components/icons'
import { containsNonPrintableChars } from 'utilities/src/primitives/string'

enum ViewEncoding {
  UTF8 = 0,
  HEX = 1,
}
interface PersonalSignRequestProps {
  dappRequest: SignMessageRequest
}

export function PersonalSignRequestContent({ dappRequest }: PersonalSignRequestProps): JSX.Element | null {
  const { t } = useTranslation()

  const [viewEncoding, setViewEncoding] = useState(ViewEncoding.UTF8)
  const [utf8Message, setUtf8Message] = useState<string | undefined>()

  const toggleViewEncoding = (): void =>
    setViewEncoding(viewEncoding === ViewEncoding.UTF8 ? ViewEncoding.HEX : ViewEncoding.UTF8)

  const hexMessage = dappRequest.messageHex
  const containsUnrenderableCharacters = !utf8Message || containsNonPrintableChars(utf8Message)
  useEffect(() => {
    try {
      const decodedMessage = toUtf8String(hexMessage)
      setUtf8Message(decodedMessage)
    } catch {
      // If the message is not valid UTF-8, we'll show the hex message instead (e.g. Polymark claim deposit message )
      setViewEncoding(ViewEncoding.HEX)
      setUtf8Message(undefined)
    }
  }, [hexMessage])

  const [isScrollable, setIsScrollable] = useState(false)
  const messageRef = useRef<HTMLElement>(null)
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
  }, [setIsScrollable, viewEncoding, utf8Message])

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
        <Tooltip.Content animationDirection="left">
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
