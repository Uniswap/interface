import { PropsWithChildren } from 'react'
import styled from 'styled-components'
import { ClickableStyle, LinkStyle, ThemedText } from 'theme'

const StyledCell = styled.div<{ justifyContent?: string; color?: string }>`
  justify-content: ${({ justifyContent }) => justifyContent ?? 'right'};
  color: ${({ color }) => color};
  padding: 14px 6px 14px 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 64px;
`
const Link = styled.a`
  color: ${({ theme }) => theme.accent1};
  text-decoration: none;
  cursor: pointer;
  display: flex;
  gap: 4px;
  ${ClickableStyle}
  ${LinkStyle}
`

function Cell({ children, ...props }: PropsWithChildren) {
  return <StyledCell {...props}>{children}</StyledCell>
}

export function TextCell({ children, ...props }: PropsWithChildren<{ [key: string]: any }>) {
  return (
    <Cell {...props}>
      <ThemedText.BodyPrimary {...props}>{children}</ThemedText.BodyPrimary>
    </Cell>
  )
}

export function LinkCell({ url, children, ...props }: PropsWithChildren<{ url: string; [key: string]: any }>) {
  return (
    <Cell {...props}>
      <Link href={url} target="_blank" rel="noopener noreferrer" data-testid={url}>
        {children}
        <sup>↗</sup>
      </Link>
    </Cell>
  )
}
