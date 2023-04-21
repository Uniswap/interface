import { Trans } from '@lingui/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const DescriptionContentHeight = 252

const DescriptionContent = () => {
  return <div style={{ height: `${DescriptionContentHeight}px` }}>Description Content</div>
}

const DetailsContent = () => {
  return <div style={{ height: `${DescriptionContentHeight}px` }}>Details Content</div>
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
  return <TabbedComponent tabs={DescriptionTabs} />
}
