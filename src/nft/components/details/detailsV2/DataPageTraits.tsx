import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { GenieAsset } from 'nft/types'

import { getBubbleText, TabNumBubble } from './shared'
import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContent = () => {
  return <div style={{ height: '492px' }}>Traits Content</div>
}

export const DataPageTraits = ({ asset }: { asset: GenieAsset }) => {
  const TraitTabs: Array<Tab> = [
    {
      title: (
        <Row gap="8px">
          <Trans>Traits</Trans>
          {asset.traits && <TabNumBubble>{getBubbleText(asset.traits.length)}</TabNumBubble>}
        </Row>
      ),
      key: 'traits',
      content: <TraitsContent />,
    },
  ]
  return <TabbedComponent tabs={TraitTabs} />
}
