import { Dropdown } from 'components/Dropdowns/Dropdown'
import { ActionButtonStyle, DropdownAction } from 'components/Tokens/TokenDetails/shared'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { Flag } from 'ui/src/components/icons/Flag'

export function MoreButton({
  openReportTokenModal,
  openReportDataIssueModal,
}: {
  openReportTokenModal: () => void
  openReportDataIssueModal: () => void
}) {
  const { t } = useTranslation()
  const { currency } = useTDPContext()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      menuLabel={<Ellipsis size="$icon.18" color="$neutral1" />}
      hideChevron
      buttonStyle={ActionButtonStyle}
      dropdownStyle={{ width: 200 }}
      alignRight
    >
      <DropdownAction onClick={openReportDataIssueModal}>
        <ChartBarCrossed size="$icon.18" color="$neutral1" />
        <Text variant="body2">{t('reporting.token.data.title')}</Text>
      </DropdownAction>
      <>
        {!currency.isNative && (
          <DropdownAction onClick={openReportTokenModal}>
            <Flag size="$icon.18" color="$statusCritical" />
            <Text variant="body2" color="$statusCritical">
              {t('reporting.token.report.title')}
            </Text>
          </DropdownAction>
        )}
      </>
    </Dropdown>
  )
}
