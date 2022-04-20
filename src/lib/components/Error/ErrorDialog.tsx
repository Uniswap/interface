import { Trans } from '@lingui/macro'
import ActionButton from 'lib/components/ActionButton'
import Column from 'lib/components/Column'
import Expando from 'lib/components/Expando'
import { AlertTriangle, Icon, LargeIcon } from 'lib/icons'
import styled, { Color, ThemedText } from 'lib/theme'
import { ReactNode, useCallback, useState } from 'react'

const HeaderIcon = styled(LargeIcon)`
  flex-grow: 1;
  transition: height 0.25s, width 0.25s;

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

interface ErrorDialogProps {
  header?: ReactNode
  error: Error
  action: ReactNode
  onClick: () => void
}

export default function ErrorDialog({ header, error, action, onClick }: ErrorDialogProps) {
  const [open, setOpen] = useState(false)
  const onExpand = useCallback(() => setOpen((open) => !open), [])

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
      <Column gap={open ? 0 : 0.75} style={{ transition: 'gap 0.25s' }}>
        <Expando title={<Trans>Error details</Trans>} open={open} onExpand={onExpand} height={7.5}>
          <ThemedText.Code userSelect>
            {error.name}
            {error.message ? `: ${error.message}` : ''}
          </ThemedText.Code>
        </Expando>
        <ActionButton onClick={onClick}>{action}</ActionButton>
      </Column>
    </Column>
  )
}
