import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { InfoLinkModal } from 'uniswap/src/components/modals/InfoLinkModal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { GasFieldTooltipProps } from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTooltip'
import { useTooltipCopy } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasFieldTooltipCopy'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { closeKeyboardBeforeCallback } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function GasFieldTooltip({ tooltipKey }: GasFieldTooltipProps): JSX.Element {
  const { t } = useTranslation()
  const { value: isOpen, setTrue: open, setFalse: close } = useBooleanState(false)
  const { title, body, Icon } = useTooltipCopy(tooltipKey)

  const onPress = useEvent(() => closeKeyboardBeforeCallback(open))

  return (
    <>
      <TouchableArea onPress={onPress}>
        <InfoCircle color="$neutral3" size="$icon.16" />
      </TouchableArea>
      <InfoLinkModal
        isOpen={isOpen}
        name={ModalName.TooltipContent}
        icon={
          <Flex centered backgroundColor="$surface3" borderRadius="$rounded12" p="$spacing12">
            <Icon color="$neutral1" size="$icon.24" />
          </Flex>
        }
        title={title}
        description={body}
        buttonText={t('common.button.close')}
        linkText={t('common.button.learn')}
        linkUrl={UniswapHelpUrls.articles.networkFeeInfo}
        onDismiss={close}
        onButtonPress={close}
      />
    </>
  )
}
