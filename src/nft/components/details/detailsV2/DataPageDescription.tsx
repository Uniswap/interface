import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const DescriptionContentContainer = styled.div`
  height: 252px;
`

const DescriptionContent = () => {
  return <DescriptionContentContainer>Description Content</DescriptionContentContainer>
}

const DetailsContent = () => {
  return <DescriptionContentContainer>Details Content</DescriptionContentContainer>
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
