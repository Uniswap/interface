import { ReportedActivityToggle } from 'components/AccountDrawer/ReportedActivityToggle'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { SmallBalanceToggle } from 'components/AccountDrawer/SmallBalanceToggle'
import { SpamTokensToggle } from 'components/AccountDrawer/SpamTokensToggle'
import { MenuColumn } from 'components/AccountDrawer/shared'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'

export default function PortfolioBalanceMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <SlideOutMenu title={t('settings.setting.balancesActivity.title')} onClose={onClose}>
      <MenuColumn>
        <Flex justifyContent="space-between">
          <SmallBalanceToggle />
          <SpamTokensToggle />
          <ReportedActivityToggle />
        </Flex>
      </MenuColumn>
    </SlideOutMenu>
  )
}
