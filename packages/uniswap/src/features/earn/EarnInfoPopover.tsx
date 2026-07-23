import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'

type EarnInfoPopoverDetailRow = {
  label: string
  value: string
  icon?: ReactNode
}

type EarnInfoPopoverLearnMore = {
  text: string
  url: string
}

export function EarnInfoPopover({
  title,
  caption,
  detailRows,
  learnMore,
  modalName,
}: {
  title: string
  caption: string
  detailRows?: EarnInfoPopoverDetailRow[]
  learnMore?: EarnInfoPopoverLearnMore
  modalName: ModalNameType
}): JSX.Element {
  const { t } = useTranslation()
  const hasDetails = detailRows !== undefined && detailRows.length > 0
  const details = hasDetails ? <EarnInfoPopoverDetails rows={detailRows} /> : undefined
  const learnMoreText = learnMore?.text
  const learnMoreUrl = learnMore?.url
  const onPressLearnMore = useCallback(() => {
    if (learnMoreUrl) {
      openUri({ uri: learnMoreUrl, openExternalBrowser: true, isSafeUri: true }).catch(() => undefined)
    }
  }, [learnMoreUrl])
  const captionComponent = learnMoreText ? (
    <Flex centered gap="$spacing8">
      <Text color="$neutral2" textAlign="center" variant="body3">
        {caption}
      </Text>
      <Text color="$neutral1" textAlign="center" variant="buttonLabel3" onPress={onPressLearnMore}>
        {learnMoreText}
      </Text>
    </Flex>
  ) : undefined

  return (
    <WarningInfo
      // Pass the icon directly — WarningInfo wraps it in its own TouchableArea on native.
      // Nesting another TouchableArea here would swallow the tap.
      trigger={<InfoCircleFilled color="$neutral3" size="$icon.16" />}
      infoButton={details}
      modalProps={{
        title,
        caption: captionComponent ? undefined : caption,
        captionComponent,
        icon: <InfoCircleFilled color="$neutral2" size="$icon.24" />,
        modalName,
        severity: WarningSeverity.None,
        rejectText: t('common.button.close'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: (
          <Text variant="body4" color={learnMoreText ? '$neutral2' : '$neutral1'}>
            {caption}
            {learnMoreText ? (
              <>
                {' '}
                <Text color="$neutral1" variant="buttonLabel4" onPress={onPressLearnMore}>
                  {learnMoreText}
                </Text>
              </>
            ) : null}
          </Text>
        ),
        placement: 'top',
      }}
    />
  )
}

function EarnInfoPopoverDetails({ rows }: { rows: EarnInfoPopoverDetailRow[] }): JSX.Element {
  return (
    <Flex gap="$spacing8" width="100%">
      <Flex backgroundColor="$surface3" height="$spacing1" width="100%" />
      <Flex gap="$spacing4" width="100%">
        {rows.map((row) => (
          <Flex key={row.label} row alignItems="center" gap="$spacing4" justifyContent="space-between">
            <Text color="$neutral2" variant="body4">
              {row.label}
            </Text>
            <Flex row alignItems="center" gap="$spacing4">
              <Text color="$neutral1" variant="body4">
                {row.value}
              </Text>
              {row.icon}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
