import { IconButton } from 'lib/components/Button'
import Column from 'lib/components/Column'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import useScrollbar from 'lib/hooks/useScrollbar'
import { Expando as ExpandoIcon } from 'lib/icons'
import styled from 'lib/theme'
import { PropsWithChildren, ReactNode, useState } from 'react'

const HeaderColumn = styled(Column)`
  transition: gap 0.25s;
`

const ExpandoColumn = styled(Column)<{ height: number; open: boolean }>`
  height: ${({ height, open }) => (open ? height : 0)}em;
  overflow: hidden;
  position: relative;
  transition: height 0.25s, padding 0.25s;

  :after {
    background: linear-gradient(transparent, ${({ theme }) => theme.dialog});
    bottom: 0;
    content: '';
    height: 0.75em;
    pointer-events: none;
    position: absolute;
    width: calc(100% - 1em);
  }
`

const InnerColumn = styled(Column)<{ height: number }>`
  height: ${({ height }) => height}em;
  padding: 0.5em 0;
`

interface ExpandoProps {
  title: ReactNode
  open: boolean
  onExpand: () => void
  // The absolute height of the expanded container, in em.
  height: number
}

/** A scrollable Expando with an absolute height. */
export default function Expando({ title, open, onExpand, height, children }: PropsWithChildren<ExpandoProps>) {
  const [scrollingEl, setScrollingEl] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(scrollingEl)
  return (
    <Column>
      <HeaderColumn gap={open ? 0.5 : 0.75}>
        <Rule />
        <Row>
          {title}
          <IconButton color="secondary" onClick={onExpand} icon={ExpandoIcon} iconProps={{ open }} />
        </Row>
        <Rule />
      </HeaderColumn>
      <ExpandoColumn open={open} height={height}>
        <InnerColumn flex align="stretch" height={height} ref={setScrollingEl} css={scrollbar}>
          {children}
        </InnerColumn>
      </ExpandoColumn>
    </Column>
  )
  return null
}
