import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { SmallBalanceToggle } from 'components/AccountDrawer/SmallBalanceToggle'
import { SpamToggle } from 'components/AccountDrawer/SpamToggle'
import { MenuColumn } from 'components/AccountDrawer/shared'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'

export default function PortfolioBalanceMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <SlideOutMenu title={t('settings.setting.smallBalances.title')} onClose={onClose}>
      <MenuColumn>
        <Flex justifyContent="space-between">
          <SmallBalanceToggle />
          <SpamToggle />
        </Flex>
      </MenuColumn>
    </SlideOutMenu>
  )
}
