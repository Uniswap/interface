import { isWebPlatform } from '@universe/environment'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LowPriceConfidenceTooltip } from 'uniswap/src/features/prices/LowPriceConfidenceIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function LowPriceConfidenceTag(): JSX.Element {
  if (isWebPlatform) {
    return (
      <LowPriceConfidenceTooltip>
        <LowPriceConfidencePill />
      </LowPriceConfidenceTooltip>
    )
  }
  return <LowPriceConfidenceTagWithSheet />
}

function LowPriceConfidenceTagWithSheet(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { value: isOpen, setTrue: open, setFalse: close } = useBooleanState(false)

  return (
    <>
      <TouchableArea onPress={open}>
        <LowPriceConfidencePill />
      </TouchableArea>
      <WarningModal
        isOpen={isOpen}
        modalName={ModalName.LowPriceConfidence}
        severity={WarningSeverity.None}
        icon={<AlertTriangleFilled color="$neutral1" size="$icon.24" />}
        backgroundIconColor={colors.surface3.val}
        title={t('token.price.lowConfidence.title')}
        caption={t('token.price.lowConfidence.tooltip')}
        rejectText={t('common.button.close')}
        onClose={close}
      />
    </>
  )
}

function LowPriceConfidencePill(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing4"
      px="$spacing8"
      py="$spacing4"
      borderRadius="$rounded6"
      backgroundColor="$surface2"
      testID={TestID.LowPriceConfidenceTag}
    >
      <AlertTriangleFilled color="$neutral2" size="$icon.12" />
      <Text variant="buttonLabel4" color="$neutral2" whiteSpace="nowrap">
        {t('token.price.lowConfidence.tag')}
      </Text>
    </Flex>
  )
}
