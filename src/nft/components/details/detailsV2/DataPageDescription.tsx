import { Trans } from '@lingui/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const DescriptionContentHeight = 252

const DescriptionContent = () => {
  return <div style={{ height: `${DescriptionContentHeight}px` }}>Description Content</div>
}

const DetailsContent = () => {
  return <div style={{ height: `${DescriptionContentHeight}px` }}>Details Content</div>
}

enum DescriptionTabsKeys {
  Description = 'description',
  Details = 'details',
}

const DescriptionTabs: Map<string, Tab> = new Map([
  [
    DescriptionTabsKeys.Description,
    {
      title: <Trans>Description</Trans>,
      key: DescriptionTabsKeys.Description,
      content: <DescriptionContent />,
    },
  ],
  [
    DescriptionTabsKeys.Details,
    {
      title: <Trans>Details</Trans>,
      key: DescriptionTabsKeys.Details,
      content: <DetailsContent />,
    },
  ],
])

export const DataPageDescription = () => {
  return <TabbedComponent tabs={DescriptionTabs} />
}
