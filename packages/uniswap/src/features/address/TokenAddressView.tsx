import { SharedEventName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { MicroConfirmation } from 'uniswap/src/components/MicroConfirmation'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WarningModalInfoContainer } from 'uniswap/src/features/tokens/WarningInfoModalContainer'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { isInterface } from 'utilities/src/platform'

export function TokenAddressView({
  currency,
  modalName,
}: {
  currency: Currency
  modalName: string
}): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [showTooltip, setShowTooltip] = useState(false)

  if (!currency || !currency.isToken) {
    return null
  }

  const onPressCopyAddress = async (): Promise<void> => {
    await setClipboard(currency.address)

    if (isInterface) {
      setShowTooltip(true)
      setTimeout(() => {
        setShowTooltip(false)
      }, 1000)
    } else {
      dispatch(pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.ContractAddress }))
    }

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Copy,
      modal: modalName,
    })
  }

  return (
    <WarningModalInfoContainer py="$spacing12" px="$spacing16">
      <Flex row centered gap="$spacing8" width="100%">
        <Flex shrink grow>
          <Text variant="body3" ellipsizeMode="middle" numberOfLines={1}>
            {currency.address}
          </Text>
        </Flex>
        <Flex shrink>
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
        </Flex>
      </Flex>
    </WarningModalInfoContainer>
  )
}
