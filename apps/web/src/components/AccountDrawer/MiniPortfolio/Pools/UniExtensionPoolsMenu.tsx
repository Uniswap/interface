import Pools from 'components/AccountDrawer/MiniPortfolio/Pools'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import Column from 'components/Column'
import styled from 'lib/styled-components'
import { Trans } from 'uniswap/src/i18n'

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
