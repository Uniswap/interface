import { Trans } from '@lingui/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContent = () => {
  return <div>Traits</div>
}

const DescriptionTabs: Array<Tab> = [
  {
    title: <Trans>Traits</Trans>,
    key: 'description',
    content: <TraitsContent />,
  },
]

export const DataPageTraits = () => {
  return <TabbedComponent tabs={DescriptionTabs} defaultTab={DescriptionTabs[0]} />
}
