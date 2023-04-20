import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'

import { containerStyles } from './shared'
import { Tab, TabbedComponent } from './TabbedComponent'

const DescriptionContainer = styled.div`
  height: 288px;
  padding: 16px 20px 20px;

  ${containerStyles}
`

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
  return (
    <DescriptionContainer>
      <TabbedComponent tabs={DescriptionTabs} defaultTab={DescriptionTabs[0]} />
    </DescriptionContainer>
  )
}
