import { Trans } from '@lingui/macro'
import useCopyClipboard from 'hooks/useCopyClipboard'
import React, { useCallback } from 'react'
import { CheckCircle, Copy, Link } from 'react-feather'
import styled from 'styled-components/macro'
import { ClickableStyle, LinkStyledButton } from 'theme'
import { Color } from 'theme/styled'

const CopyHelperContainer = styled(LinkStyledButton)<{ clicked: boolean }>`
  ${({ clicked }) => !clicked && ClickableStyle};
  color: ${({ color, theme }) => color || theme.accentAction};
  padding: 0;
  flex-shrink: 0;
  display: flex;
  text-decoration: none;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ color, theme }) => color || theme.accentAction};
  }
`
const StyledText = styled.span<{ fontSize: number; right?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  ${({ right }) => right && `align-self: flex-start`};
  font-size: ${({ fontSize }) => fontSize + 'px'};
  font-weight: 400;
  align-items: center;
`

const CopyIcon = ({ link }: { link?: boolean }) => {
  return link ? <Link size="1.25rem" strokeWidth={1.5} /> : <Copy size="1.25rem" strokeWidth={1.5} />
}
const CopiedIcon = styled(CheckCircle)`
  color: ${({ theme }) => theme.accentSuccess};
  stroke-width: 1.5px;
`

interface BaseProps {
  link?: boolean
  toCopy: string
  color?: Color
  fontSize?: number
  iconSize?: number
  gap?: number
  iconPosition?: 'left' | 'right'
  iconColor?: Color
}
export type CopyHelperProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>

export default function CopyHelper({
  link,
  toCopy,
  color,
  fontSize = 16,
  iconSize = 20,
  gap = 12,
  iconPosition = 'left',
  iconColor,
  children,
}: CopyHelperProps) {
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])

  const CopyIcon = isCopied ? CopiedIcon : link ? Link : Copy

  return (
    <CopyHelperContainer onClick={copy} color={color} clicked={isCopied}>
      <div style={{ display: 'flex', flexDirection: 'row', gap }}>
        <CopyIcon size={iconSize} strokeWidth={1.5} />
        <StyledText right={iconPosition == 'right'} fontSize={fontSize}>
          {isCopied ? <Trans>Copied!</Trans> : children}
        </StyledText>
      </div>
    </CopyHelperContainer>
  )
}
