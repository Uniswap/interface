import { Trans } from '@lingui/macro'
import { GenieAsset } from 'nft/types'
import { useMemo } from 'react'
import styled from 'styled-components/macro'

import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContentContainer = styled.div`
  height: 492px;
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
            title: <Trans>Traits</Trans>,
            key: TraitTabsKeys.Traits,
            content: <TraitsContent />,
            count: asset.traits?.length,
          },
        ],
      ]),
    [asset.traits?.length]
  )
  return <TabbedComponent tabs={TraitTabs} />
}
