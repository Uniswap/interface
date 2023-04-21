import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { GenieAsset } from 'nft/types'

import { TabNumBubble } from './shared'
import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContent = () => {
  return <div>Traits Content</div>
}

export const DataPageTraits = ({ asset }: { asset: GenieAsset }) => {
  const TraitTabs: Array<Tab> = [
    {
      title: (
        <Row gap="8px">
          <Trans>Traits</Trans>
          {asset.traits && <TabNumBubble>{asset.traits.length > 10 ? '10+' : asset.traits?.length}</TabNumBubble>}
        </Row>
      ),
      key: 'traits',
      content: <TraitsContent />,
    },
  ]
  return <TabbedComponent tabs={TraitTabs} style={{ height: '528px' }} />
}
