import { Trans } from '@lingui/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const DescriptionContent = () => {
  return <div>Description Content</div>
}

const DetailsContent = () => {
  return <div>Details Content</div>
}

const DescriptionTabs: Array<Tab> = [
  {
    title: <Trans>Description</Trans>,
    key: 'description',
    content: <DescriptionContent />,
  },
  {
    title: <Trans>Details</Trans>,
    key: 'details',
    content: <DetailsContent />,
  },
]

export const DataPageDescription = () => {
  return <TabbedComponent tabs={DescriptionTabs} style={{ height: '288px' }} />
}
