import { Trans } from '@lingui/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContent = () => {
  return <div>Traits Content</div>
}

enum TraitTabsKeys {
  Traits = 'traits',
}

const TraitTabs: Map<string, Tab> = new Map([
  [
    TraitTabsKeys.Traits,
    {
      title: <Trans>Traits</Trans>,
      key: TraitTabsKeys.Traits,
      content: <TraitsContent />,
    },
  ],
])

export const DataPageTraits = () => {
  return <TabbedComponent tabs={TraitTabs} style={{ height: '528px' }} />
}
