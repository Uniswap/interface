import { Trans } from '@lingui/macro'
import useCopyClipboard from 'hooks/useCopyClipboard'
import React, { useCallback } from 'react'
import { CheckCircle, Copy, Link } from 'react-feather'
import styled from 'styled-components/macro'
import { ClickableStyle, LinkStyledButton } from 'theme'
import { Color } from 'theme/styled'

const CopiedIcon = styled(CheckCircle)<{ size: number }>`
  color: ${({ theme }) => theme.accentSuccess};
`

const CopyHelperContainer = styled(LinkStyledButton)`
  color: ${({ color, theme }) => color || theme.accentAction};
  font-size: inherit;
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
const StyledText = styled.span`
  ${ClickableStyle}
  ${({ theme }) => theme.flexRowNoWrap};
  color: inherit;
  font-size: inherit;
  padding-left: 10px;
  align-items: center;
`

const CopyIcon = ({ iconSize, link }: { iconSize?: number; link?: boolean }) => {
  return link ? <Link size={iconSize ?? '16'} /> : <Copy size={iconSize ?? '16'} />
}

interface BaseProps {
  link?: boolean
  toCopy: string
  color?: Color
  iconSize?: number
  iconPosition?: 'left' | 'right'
  iconColor?: Color
}
export type CopyHelperProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>

export default function CopyHelper({ link, color, toCopy, children, iconSize, iconPosition }: CopyHelperProps) {
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])

  return (
    <CopyHelperContainer onClick={copy} color={color}>
      {iconPosition === 'left' ? (
        isCopied ? (
          <CopiedIcon size={iconSize ?? 16} />
        ) : (
          <CopyIcon link={link} iconSize={iconSize} />
        )
      ) : null}
      {isCopied ? (
        <StyledText>
          <Trans>Copied</Trans>
        </StyledText>
      ) : (
        <StyledText>{children}</StyledText>
      )}
      {iconPosition === 'right' ? (
        isCopied ? (
          <CopiedIcon size={iconSize ?? 16} />
        ) : (
          <CopyIcon link={link} iconSize={iconSize} />
        )
      ) : null}
    </CopyHelperContainer>
  )
}
