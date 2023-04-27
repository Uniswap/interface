import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { GenieAsset, Trait } from 'nft/types'
import { useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { opacify } from 'theme/utils'

import { Tab, TabbedComponent } from './TabbedComponent'
import { TraitRow } from './TraitRow'

const TraitsHeaderContainer = styled(Row)`
  padding-right: 12px;
`

const TraitsHeader = styled(ThemedText.SubHeaderSmall)<{ $flex?: number; alignRight?: boolean }>`
  display: flex;
  line-height: 20px;
  color: ${({ theme }) => theme.textSecondary};
  flex: ${({ $flex }) => $flex ?? 1};
  ${({ alignRight }) => alignRight && 'justify-content: flex-end'};
`

const TraitRowContainer = styled.div`
  position: relative;
`

const TraitRowScrollableContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 412px;
  ${ScrollBarStyles}
`

const Scrim = styled.div<{ isBottom?: boolean }>`
  position: absolute;
  height: 88px !important;
  left: 0px;
  right: 12px;
  ${({ isBottom }) => !isBottom && 'top: 0px'};
  ${({ isBottom }) => !isBottom && 'transform: matrix(1, 0, 0, -1, 0, 0)'};

  ${({ isBottom }) => isBottom && 'bottom: 0px'};

  background: ${({ theme }) =>
    `linear-gradient(180deg, ${opacify(0, theme.backgroundSurface)} 0%, ${theme.backgroundSurface} 100%)`}};
  display: flex;
`

const TraitsContent = ({ traits }: { traits?: Trait[] }) => {
  const [userCanScroll, setUserCanScroll] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = (node: HTMLDivElement) => {
    if (node !== null) {
      const canScroll = node.scrollHeight > node.clientHeight
      canScroll !== userCanScroll && setUserCanScroll(canScroll)
    }
  }

  const scrollHandler = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    const containerHeight = event.currentTarget.clientHeight
    const scrollHeight = event.currentTarget.scrollHeight

    setScrollProgress(scrollTop ? ((scrollTop + containerHeight) / scrollHeight) * 100 : 0)
  }

  // This is needed to prevent rerenders when handling scrolls
  const traitRows = useMemo(() => {
    return traits?.map((trait) => <TraitRow trait={trait} key={trait.trait_type + ':' + trait.trait_value} />)
  }, [traits])

  return (
    <Column>
      <TraitsHeaderContainer>
        <TraitsHeader $flex={3}>
          <Trans>Trait</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader $flex={2}>
          <Trans>Floor price</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader>
          <Trans>Quantity</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader $flex={1.5} alignRight={true}>
          <Trans>Rarity</Trans>
        </TraitsHeader>
      </TraitsHeaderContainer>
      <TraitRowContainer>
        {scrollProgress > 0 && <Scrim />}
        <TraitRowScrollableContainer ref={scrollRef} onScroll={scrollHandler}>
          {traitRows}
        </TraitRowScrollableContainer>
        {userCanScroll && scrollProgress !== 100 && <Scrim isBottom={true} />}
      </TraitRowContainer>
    </Column>
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
