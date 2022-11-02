import React from 'react'
import { useTranslation } from 'react-i18next'
import SendIcon from 'src/assets/icons/send.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'

export function TokenDetailsActionButtons({
  onPressSwap,
  onPressSend,
  showSend,
}: {
  onPressSwap?: () => void
  onPressSend?: () => void
  showSend?: boolean
}) {
  const { t } = useTranslation()

  return (
    <Flex
      row
      bg="background0"
      borderTopColor="backgroundOutline"
      borderTopWidth={1}
      gap="xs"
      pb="md"
      pt="sm"
      px="lg">
      <Button
        fill
        disabled={!onPressSwap}
        label={t('Swap')}
        size={ButtonSize.Large}
        onPress={onPressSwap}
      />

      {showSend && (
        <Button
          IconName={SendIcon}
          disabled={!onPressSend}
          emphasis={ButtonEmphasis.Secondary}
          name={ElementName.Send}
          size={ButtonSize.Large}
          onPress={onPressSend}
        />
      )}
    </Flex>
  )
}
