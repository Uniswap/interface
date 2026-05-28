import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text } from 'ui/src'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { Ellipsis } from 'ui/src/components/icons/Ellipsis'
import { iconSizes } from 'ui/src/theme'
import { ReportPortfolioDataModal } from 'uniswap/src/components/reporting/ReportPortfolioDataModal'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

const DROPDOWN_MIN_WIDTH = 200

const moreMenuButtonStyle = {
  px: '$spacing8',
  borderWidth: 0,
} as const

interface PortfolioMoreMenuProps {
  size?: 'small' | 'medium'
  transition?: FlexProps['transition']
}

export function PortfolioMoreMenu({ size = 'medium', transition }: PortfolioMoreMenuProps): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { value: isReportModalOpen, setTrue: openReportModal, setFalse: closeReportModal } = useBooleanState(false)

  const onReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-portfolio-data-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const iconSize = size === 'small' ? iconSizes.icon16 : iconSizes.icon20

  const onReportPress = useEvent(() => {
    setIsOpen(false)
    openReportModal()
  })

  return (
    <>
      <Dropdown
        isOpen={isOpen}
        toggleOpen={setIsOpen}
        menuLabel={
          <Flex>
            <Ellipsis size={iconSize} color="$neutral1" transition={transition} />
          </Flex>
        }
        hideChevron
        buttonStyle={{
          ...moreMenuButtonStyle,
          height: size === 'small' ? 32 : 40,
        }}
        dropdownStyle={{ minWidth: DROPDOWN_MIN_WIDTH }}
        alignRight
      >
        <InternalMenuItem onPress={onReportPress}>
          <Flex row alignItems="center" gap="$gap12">
            <ChartBarCrossed size={iconSizes.icon16} color="$neutral1" />
            <Text variant="buttonLabel3">{t('reporting.portfolio.data.title')}</Text>
          </Flex>
        </InternalMenuItem>
      </Dropdown>

      <ReportPortfolioDataModal
        isOpen={isReportModalOpen}
        onReportSuccess={onReportSuccess}
        onClose={closeReportModal}
      />
    </>
  )
}
