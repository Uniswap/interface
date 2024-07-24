import Pools from 'components/AccountDrawer/MiniPortfolio/Pools'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import Column from 'components/Column'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'

const Container = styled(Column)`
  height: 100%;
  position: relative;
`

export function UniExtensionPoolsMenu({ onClose, account }: { account: string; onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans i18nKey="common.pools" />} onClose={onClose}>
      <Container>
        <Pools account={account} />
      </Container>
    </SlideOutMenu>
  )
}
