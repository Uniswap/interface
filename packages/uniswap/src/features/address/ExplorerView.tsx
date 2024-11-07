import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Anchor, Flex, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { MicroConfirmation } from 'uniswap/src/components/MicroConfirmation'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WarningModalInfoContainer } from 'uniswap/src/features/tokens/TokenWarningModal'
import { useTranslation } from 'uniswap/src/i18n'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isInterface } from 'utilities/src/platform'

export function ExplorerView({ currency, modalName }: { currency: Currency; modalName: string }): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [showTooltip, setShowTooltip] = useState(false)
  if (currency) {
    const explorerLink = getExplorerLink(
      currency.chainId,
      currency.isToken ? currency.address : '',
      currency.isToken ? ExplorerDataType.TOKEN : ExplorerDataType.NATIVE,
    )
    const onPressCopyAddress = async (): Promise<void> => {
      await setClipboard(explorerLink)

      if (isInterface) {
        setShowTooltip(true)
        setTimeout(() => {
          setShowTooltip(false)
        }, 1000)
      } else {
        dispatch(
          pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.BlockExplorerUrl }),
        )
      }

      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.Copy,
        modal: modalName,
      })
    }

    return (
      <WarningModalInfoContainer row height={40} gap="$spacing8">
        <Flex flex={1}>
          <Anchor href={explorerLink} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
            <Flex row gap="$spacing8" flexWrap="nowrap" width="100%" alignItems="center">
              <Text variant="body3" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {explorerLink}
              </Text>
              <Flex centered>
                <ExternalLink size="$icon.16" color="$neutral1" />
              </Flex>
            </Flex>
          </Anchor>
        </Flex>
        <MicroConfirmation
          text={t('common.button.copied')}
          icon={<CheckCircleFilled color="$statusSuccess" size="$icon.20" />}
          showTooltip={showTooltip}
          trigger={
            <TouchableArea hoverable onPress={onPressCopyAddress}>
              <CopyAlt size="$icon.16" color="$neutral1" />
            </TouchableArea>
          }
        />
      </WarningModalInfoContainer>
    )
  } else {
    return null
  }
}
