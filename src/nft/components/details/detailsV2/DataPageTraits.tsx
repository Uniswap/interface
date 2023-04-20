import { Trans } from '@lingui/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContent = () => {
  return <div>Traits Content</div>
}

const TraitTabs: Array<Tab> = [
  {
    title: <Trans>Traits</Trans>,
    key: 'traits',
    content: <TraitsContent />,
  },
]

export const DataPageTraits = () => {
  return <TabbedComponent tabs={TraitTabs} defaultTab={TraitTabs[0]} style={{ height: '528px' }} />
}
