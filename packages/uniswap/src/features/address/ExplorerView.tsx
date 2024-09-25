import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { Anchor, Flex, Text, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WarningModalInfoContainer } from 'uniswap/src/features/tokens/TokenWarningModal'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

export function ExplorerView({ currency, modalName }: { currency: Currency; modalName: string }): JSX.Element | null {
  if (currency) {
    const explorerLink = getExplorerLink(
      currency.chainId,
      currency.isToken ? currency.address : '',
      currency.isToken ? ExplorerDataType.TOKEN : ExplorerDataType.NATIVE,
    )

    const onPressCopyAddress = async (): Promise<void> => {
      await setClipboard(explorerLink)
      // TODO(WALL-4688): should we dispatch(pushNotification()) here on mobile/ext, tooltip on interface?

      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.Copy,
        modal: modalName,
      })
    }

    return (
      <WarningModalInfoContainer row height={40} gap="$spacing8">
        <Flex flex={1}>
          <Anchor href={explorerLink} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
            <Flex row gap="$spacing8" flexWrap="nowrap" width="100%">
              <Text variant="body3" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {explorerLink}
              </Text>
              <Flex centered>
                <ExternalLink size="$icon.16" color="$neutral1" />
              </Flex>
            </Flex>
          </Anchor>
        </Flex>
        <TouchableArea hapticFeedback hoverable onPress={onPressCopyAddress}>
          <CopyAlt size="$icon.16" color="$neutral1" />
        </TouchableArea>
      </WarningModalInfoContainer>
    )
  } else {
    return null
  }
}
