import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export function EarnInfoPopover({
  title,
  caption,
  modalName,
}: {
  title: string
  caption: string
  modalName: ModalNameType
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <WarningInfo
      // Pass the icon directly — WarningInfo wraps it in its own TouchableArea on native.
      // Nesting another TouchableArea here would swallow the tap.
      trigger={<InfoCircleFilled color="$neutral3" size="$icon.16" />}
      modalProps={{
        title,
        caption,
        icon: <InfoCircleFilled color="$neutral2" size="$icon.24" />,
        modalName,
        severity: WarningSeverity.None,
        rejectText: t('common.button.close'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: (
          <Text variant="body4" color="$neutral1">
            {caption}
          </Text>
        ),
        placement: 'top',
      }}
    />
  )
}
