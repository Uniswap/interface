import { Trans } from '@lingui/macro'
import { GenieAsset } from 'nft/types'

import { Tab, TabbedComponent, TabTitleWithBubble } from './TabbedComponent'

const TraitsContent = () => {
  return <div style={{ height: '492px' }}>Traits Content</div>
}

enum TraitTabsKeys {
  Traits = 'traits',
}

export const DataPageTraits = ({ asset }: { asset: GenieAsset }) => {
  const TraitTabs: Map<string, Tab> = new Map([
    [
      TraitTabsKeys.Traits,
      {
        title: <TabTitleWithBubble title={<Trans>Traits</Trans>} bubbleNumber={asset.traits?.length} />,
        key: TraitTabsKeys.Traits,
        content: <TraitsContent />,
      },
    ],
  ])
  return <TabbedComponent tabs={TraitTabs} />
}
