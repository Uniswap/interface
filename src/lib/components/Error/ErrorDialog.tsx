import { Trans } from '@lingui/macro'
import useScrollbar from 'lib/hooks/useScrollbar'
import { AlertTriangle, Expando, Icon, Info, LargeIcon } from 'lib/icons'
import styled, { Color, ThemedText } from 'lib/theme'
import { ReactNode, useState } from 'react'

import ActionButton from '../ActionButton'
import { IconButton } from '../Button'
import Column from '../Column'
import Row from '../Row'
import Rule from '../Rule'

const HeaderIcon = styled(LargeIcon)`
  flex-grow: 1;

  svg {
    transition: height 0.25s, width 0.25s;
  }
`

interface StatusHeaderProps {
  icon: Icon
  iconColor?: Color
  iconSize?: number
  children: ReactNode
}

export function StatusHeader({ icon: Icon, iconColor, iconSize = 4, children }: StatusHeaderProps) {
  return (
    <>
      <Column flex style={{ flexGrow: 1 }}>
        <HeaderIcon icon={Icon} color={iconColor} size={iconSize} />
        <Column gap={0.75} flex style={{ textAlign: 'center' }}>
          {children}
        </Column>
      </Column>
      <Rule />
    </>
  )
}

const ErrorHeader = styled(Column)<{ open: boolean }>`
  transition: gap 0.25s;

  div:last-child {
    max-height: ${({ open }) => (open ? 0 : 60 / 14)}em; // 3 * line-height
    overflow-y: hidden;
    transition: max-height 0.25s;
  }
`
const ErrorColumn = styled(Column)``
const ExpandoColumn = styled(Column)<{ open: boolean }>`
  flex-grow: ${({ open }) => (open ? 2 : 0)};
  transition: flex-grow 0.25s, gap 0.25s;

  ${Rule} {
    margin-bottom: ${({ open }) => (open ? 0 : 0.75)}em;
    transition: margin-bottom 0.25s;
  }

  ${ErrorColumn} {
    flex-basis: 0;
    flex-grow: ${({ open }) => (open ? 1 : 0)};
    overflow-y: hidden;
    position: relative;
    transition: flex-grow 0.25s;

    ${Column} {
      height: 100%;
      padding: ${({ open }) => (open ? '0.5em 0' : 0)};
      transition: padding 0.25s;

      :after {
        background: linear-gradient(#ffffff00, ${({ theme }) => theme.dialog});
        bottom: 0;
        content: '';
        height: 0.75em;
        pointer-events: none;
        position: absolute;
        width: calc(100% - 1em);
      }
    }
  }
`

interface ErrorDialogProps {
  header?: ReactNode
  error: Error
  action: ReactNode
  onClick: () => void
}

export default function ErrorDialog({ header, error, action, onClick }: ErrorDialogProps) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(details)
  return (
    <Column flex padded gap={0.75} align="stretch" style={{ height: '100%' }}>
      <StatusHeader icon={AlertTriangle} iconColor="error" iconSize={open ? 3 : 4}>
        <ErrorHeader gap={open ? 0 : 0.75} open={open}>
          <ThemedText.Subhead1>
            <Trans>Something went wrong.</Trans>
          </ThemedText.Subhead1>
          <ThemedText.Body2>{header}</ThemedText.Body2>
        </ErrorHeader>
      </StatusHeader>
      <Row>
        <Row gap={0.5}>
          <Info color="secondary" />
          <ThemedText.Subhead2 color="secondary">
            <Trans>Error details</Trans>
          </ThemedText.Subhead2>
        </Row>
        <IconButton color="secondary" onClick={() => setOpen(!open)} icon={Expando} iconProps={{ open }} />
      </Row>
      <ExpandoColumn flex align="stretch" open={open}>
        <Rule />
        <ErrorColumn>
          <Column gap={0.5} ref={setDetails} css={scrollbar}>
            <ThemedText.Code>
              {error.name}
              {error.message ? `: ${error.message}` : ''}
            </ThemedText.Code>
          </Column>
        </ErrorColumn>
        <ActionButton onClick={onClick}>{action}</ActionButton>
      </ExpandoColumn>
    </Column>
  )
}
