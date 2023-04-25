import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { GenieAsset, Trait } from 'nft/types'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Tab, TabbedComponent } from './TabbedComponent'

const TraitsContentContainer = styled(Column)`
  padding-right: 12px;
`

const TraitsHeader = styled(ThemedText.SubHeaderSmall)<{ $flex?: number; alignRight?: boolean }>`
  display: flex;
  line-height: 20px;
  color: ${({ theme }) => theme.textSecondary};
  flex: ${({ $flex }) => $flex ?? 1};
  ${({ alignRight }) => alignRight && 'justify-content: flex-end'};
`

const TraitsContent = ({ traits }: { traits?: Trait[] }) => {
  return (
    <TraitsContentContainer>
      <Row>
        <TraitsHeader $flex={3}>
          <Trans>Trait</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader $flex={1.5}>
          <Trans>Floor price</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader>
          <Trans>Quantity</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader alignRight={true}>
          <Trans>Rarity</Trans>
        </TraitsHeader>
      </Row>
      {traits?.map((trait) => (
        <Row key={trait.trait_type + ':' + trait.trait_value}>{trait.trait_type + ':' + trait.trait_value} </Row>
      ))}
    </TraitsContentContainer>
  )
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
            content: <TraitsContent traits={asset.traits} />,
            count: asset.traits?.length,
          },
        ],
      ]),
    [asset.traits]
  )
  return <TabbedComponent tabs={TraitTabs} />
}
