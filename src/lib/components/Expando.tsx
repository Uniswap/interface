import { IconButton } from 'lib/components/Button'
import Column from 'lib/components/Column'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import useScrollbar from 'lib/hooks/useScrollbar'
import { Expando as ExpandoIcon } from 'lib/icons'
import styled from 'lib/theme'
import { PropsWithChildren, ReactNode, useState } from 'react'

const MarginColumn = styled(Column)`
  transition: margin-bottom 0.25s;
`

const HeaderColumn = styled(Column)`
  transition: gap 0.25s;
`

const ExpandoColumn = styled(Column)<{ height: number; open: boolean }>`
  height: ${({ height, open }) => (open ? height : 0)}em;
  overflow: hidden;
  position: relative;
  transition: height 0.25s, padding 0.25s;

  :after {
    background: linear-gradient(#ffffff00, ${({ theme }) => theme.dialog});
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
  // The height of the bottom margin to ignore when expanded, in em.
  // This allows the expanded container to abut any subsequent content, and appear to scroll "behind" it.
  marginBottom?: number
}

/** A scrollable Expando with an absolute height. */
export default function Expando({
  title,
  open,
  onExpand,
  height,
  marginBottom,
  children,
}: PropsWithChildren<ExpandoProps>) {
  const [expando, setExpando] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(expando)
  return (
    <MarginColumn style={{ marginBottom: open && marginBottom ? `${-marginBottom}em` : undefined }}>
      <HeaderColumn gap={open ? 0.5 : 0.75}>
        <Rule />
        <Row>
          {title}
          <IconButton color="secondary" onClick={onExpand} icon={ExpandoIcon} iconProps={{ open }} />
        </Row>
        <Rule />
      </HeaderColumn>
      <ExpandoColumn open={open} height={height}>
        <InnerColumn flex align="stretch" height={height} ref={setExpando} css={scrollbar}>
          {children}
        </InnerColumn>
      </ExpandoColumn>
    </MarginColumn>
  )
  return null
}
