import { Trans } from '@lingui/macro'
import { GenieAsset } from 'nft/types'
import { useMemo } from 'react'
import styled from 'styled-components/macro'

import { Tab, TabbedComponent, TabTitleWithBubble } from './TabbedComponent'

const TraitsContentContainer = styled.div`
  height: 252px;
`

const TraitsContent = () => {
  return <TraitsContentContainer>Traits Content</TraitsContentContainer>
}

enum TraitTabsKeys {
  Traits = 'traits',
}

export const DataPageTraits = ({ asset }: { asset: GenieAsset }) => {
  const TraitTabs: Map<string, Tab> = useMemo(
    () =>
      new Map([
        [
          TraitTabsKeys.Traits,
          {
            title: <TabTitleWithBubble title={<Trans>Traits</Trans>} bubbleNumber={asset.traits?.length} />,
            key: TraitTabsKeys.Traits,
            content: <TraitsContent />,
          },
        ],
      ]),
    [asset.traits?.length]
  )
  return <TabbedComponent tabs={TraitTabs} />
}
