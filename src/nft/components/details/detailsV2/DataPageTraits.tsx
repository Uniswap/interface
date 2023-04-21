import { Trans } from '@lingui/macro'
import { GenieAsset } from 'nft/types'

import { Tab, TabbedComponent, TabTitleWithBubble } from './TabbedComponent'

const TraitsContent = () => {
  return <div style={{ height: '492px' }}>Traits Content</div>
}

export const DataPageTraits = ({ asset }: { asset: GenieAsset }) => {
  const TraitTabs: Array<Tab> = [
    {
      title: <TabTitleWithBubble title={<Trans>Traits</Trans>} bubbleNumber={asset.traits?.length} />,
      key: 'traits',
      content: <TraitsContent />,
    },
  ]
  return <TabbedComponent tabs={TraitTabs} />
}
