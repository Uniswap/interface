import { Trans } from '@lingui/macro'
import { outboundLink } from 'components/analytics'
import { MOBILE_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import useCopyClipboard from 'hooks/useCopyClipboard'
import React, {
  forwardRef,
  HTMLProps,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Copy,
  ExternalLink as ExternalLinkIconFeather,
  Icon,
  X,
} from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css, keyframes } from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import { ReactComponent as TooltipTriangle } from '../../assets/svg/tooltip_triangle.svg'
import { anonymizeLink } from '../../utils/anonymizeLink'

// TODO: Break this file into a components folder

export const CloseIcon = styled(X)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
`

// for wrapper react feather icons
export const IconWrapper = styled.div<{ stroke?: string; size?: string; marginRight?: string; marginLeft?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ size }) => size ?? '20px'};
  height: ${({ size }) => size ?? '20px'};
  margin-right: ${({ marginRight }) => marginRight ?? 0};
  margin-left: ${({ marginLeft }) => marginLeft ?? 0};
  & > * {
    stroke: ${({ theme, stroke }) => stroke ?? theme.accentActive};
  }
`

// A button that triggers some onClick result, but looks like a link.
export const LinkStyledButton = styled.button<{ disabled?: boolean }>`
  border: none;
  text-decoration: none;
  background: none;

  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  color: ${({ theme, disabled }) => (disabled ? theme.textSecondary : theme.accentAction)};
  font-weight: 500;

  :hover {
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :focus {
    outline: none;
    text-decoration: ${({ disabled }) => (disabled ? null : 'underline')};
  }

  :active {
    text-decoration: none;
  }
`

export const ButtonText = styled.button`
  outline: none;
  border: none;
  font-size: inherit;
  padding: 0;
  margin: 0;
  background: none;
  cursor: pointer;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  transition-timing-function: ease-in-out;
  transition-property: opacity, color, background-color;

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  :focus {
    text-decoration: underline;
  }
`

export const EllipsisStyle = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const ClickableStyle = css`
  text-decoration: none;
  cursor: pointer;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

  :hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  :active {
    opacity: ${({ theme }) => theme.opacity.click};
  }
`

export const LinkStyle = css`
  color: ${({ theme }) => theme.accentAction};
  stroke: ${({ theme }) => theme.accentAction};
  font-weight: 500;
`

// An internal link from the react-router-dom library that is correctly styled
export const StyledInternalLink = styled(Link)`
  ${ClickableStyle}
  ${LinkStyle}
`

const LinkIconWrapper = styled.a`
  align-items: center;
  justify-content: center;
  display: flex;
`

const IconStyle = css`
  height: 16px;
  width: 18px;
  margin-left: 10px;
`

const LinkIcon = styled(ExternalLinkIconFeather)`
  ${IconStyle}
  ${ClickableStyle}
  ${LinkStyle}
`

const CopyIcon = styled(Copy)`
  ${IconStyle}
  ${ClickableStyle}
  ${LinkStyle}
  stroke: ${({ theme }) => theme.accentAction};
`

const rotateImg = keyframes`
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }

  100% {
    transform: perspective(1000px) rotateY(360deg);
  }
`

export const UniTokenAnimated = styled.img`
  animation: ${rotateImg} 5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  padding: 2rem 0 0 0;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15));
`

function handleClickExternalLink(event: React.MouseEvent<HTMLAnchorElement>) {
  const { target, href } = event.currentTarget

  const anonymizedHref = anonymizeLink(href)

  // don't prevent default, don't redirect if it's a new tab
  if (target === '_blank' || event.ctrlKey || event.metaKey) {
    outboundLink({ label: anonymizedHref }, () => {
      console.debug('Fired outbound link event', anonymizedHref)
    })
  } else {
    event.preventDefault()
    // send a ReactGA event and then trigger a location change
    outboundLink({ label: anonymizedHref }, () => {
      window.location.href = anonymizedHref
    })
  }
}

const StyledLink = styled.a`
  ${ClickableStyle}
  ${LinkStyle}
`

export const StyledRouterLink = styled(Link)`
  ${ClickableStyle}
  ${LinkStyle}
`

/**
 * Outbound link that handles firing google analytics events
 */
export function ExternalLink({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref' | 'onClick'> & { href: string }) {
  return <StyledLink target={target} rel={rel} href={href} onClick={handleClickExternalLink} {...rest} />
}

export function ExternalLinkIcon({
  target = '_blank',
  href,
  rel = 'noopener noreferrer',
  ...rest
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref' | 'onClick'> & { href: string }) {
  return (
    <LinkIconWrapper target={target} rel={rel} href={href} onClick={handleClickExternalLink} {...rest}>
      <LinkIcon />
    </LinkIconWrapper>
  )
}

const TOOLTIP_WIDTH = 60

const ToolTipWrapper = styled.div<{ isCopyContractTooltip?: boolean; tooltipX?: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  left: ${({ isCopyContractTooltip, tooltipX }) =>
    isCopyContractTooltip && (tooltipX ? `${tooltipX - TOOLTIP_WIDTH / 2}px` : '50%')};
  transform: translate(5px, 32px);
  z-index: ${Z_INDEX.tooltip};
`

const StyledTooltipTriangle = styled(TooltipTriangle)`
  path {
    fill: ${({ theme }) => theme.black};
  }
`

const CopiedTooltip = styled.div<{ isCopyContractTooltip?: boolean }>`
  background-color: ${({ theme }) => theme.black};
  text-align: center;
  justify-content: center;
  width: ${({ isCopyContractTooltip }) => !isCopyContractTooltip && `${TOOLTIP_WIDTH}px`};
  height: ${({ isCopyContractTooltip }) => !isCopyContractTooltip && '32px'};
  line-height: ${({ isCopyContractTooltip }) => !isCopyContractTooltip && '32px'};

  padding: ${({ isCopyContractTooltip }) => isCopyContractTooltip && '8px'};
  border-radius: 8px;

  color: ${({ theme }) => theme.white};
  font-size: 12px;
`

function Tooltip({ isCopyContractTooltip, tooltipX }: { isCopyContractTooltip: boolean; tooltipX?: number }) {
  return (
    <ToolTipWrapper isCopyContractTooltip={isCopyContractTooltip} tooltipX={tooltipX}>
      <StyledTooltipTriangle />
      <CopiedTooltip isCopyContractTooltip={isCopyContractTooltip}>Copied!</CopiedTooltip>
    </ToolTipWrapper>
  )
}

const CopyIconWrapper = styled.div`
  text-decoration: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  display: flex;
`

export function CopyToClipboard({ toCopy, children }: PropsWithChildren<{ toCopy: string }>) {
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])
  return (
    <CopyIconWrapper onClick={copy}>
      {children}
      {isCopied && <Tooltip isCopyContractTooltip={false} />}
    </CopyIconWrapper>
  )
}

export function CopyLinkIcon({ toCopy }: { toCopy: string }) {
  return (
    <CopyToClipboard toCopy={toCopy}>
      <CopyIcon />
    </CopyToClipboard>
  )
}

const FullAddress = styled.span`
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const TruncatedAddress = styled.span`
  display: none;
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: flex;
  }
`

const CopyAddressRow = styled.div<{ isClicked: boolean }>`
  ${ClickableStyle}
  color: inherit;
  stroke: inherit;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  display: flex;
  gap: 6px;
  ${({ theme, isClicked }) => isClicked && `opacity: ${theme.opacity.click} !important`}
`

const CopyContractAddressWrapper = styled.div`
  align-items: center;
  justify-content: center;
  display: flex;
`

export function CopyContractAddress({ address }: { address: string }) {
  const [isCopied, setCopied] = useCopyClipboard()
  const [tooltipX, setTooltipX] = useState<number | undefined>()
  const copy = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      setTooltipX(e.clientX)
      setCopied(address)
    },
    [address, setCopied]
  )

  const truncated = `${address.slice(0, 4)}...${address.slice(-3)}`
  return (
    <CopyContractAddressWrapper onClick={copy}>
      <CopyAddressRow isClicked={isCopied}>
        <FullAddress>{address}</FullAddress>
        <TruncatedAddress>{truncated}</TruncatedAddress>
        <Copy size={14} />
      </CopyAddressRow>
      {isCopied && <Tooltip isCopyContractTooltip tooltipX={tooltipX} />}
    </CopyContractAddressWrapper>
  )
}

const CopyHelperContainer = styled.div<{ clicked: boolean; color?: string; gap: number }>`
  ${ClickableStyle}
  display: flex;
  flex-direction: row;
  gap: ${({ gap }) => gap + 'px'};
  align-items: center;
  color: ${({ color }) => color ?? 'inherit'};
`

const CopyHelperText = styled.div<{ fontSize?: number; offset: number }>`
  ${EllipsisStyle}
  ${({ fontSize }) => (fontSize ? 'font-size: ' + fontSize + 'px' : 'inherit')};
  max-width: calc(100% - ${({ offset }) => offset + 'px'});
`

const StyledCheckCircle = styled(CheckCircle)`
  color: ${({ theme }) => theme.accentSuccess};
  stroke-width: 1.5px;
`

function isEllipsisActive(element: HTMLDivElement | null) {
  return Boolean(element && element.offsetWidth < element.scrollWidth)
}

interface CopyHelperProps {
  InitialIcon?: Icon | null
  CopiedIcon?: Icon
  toCopy: string
  color?: string
  fontSize?: number
  iconSize?: number
  gap?: number
  iconPosition?: 'left' | 'right'
  iconColor?: string
  children: ReactNode
}

export type CopyHelperRefType = { forceCopy: () => void }
export const CopyHelper = forwardRef<CopyHelperRefType, CopyHelperProps>(
  (
    {
      InitialIcon = Copy,
      CopiedIcon = StyledCheckCircle,
      toCopy,
      color,
      fontSize,
      iconSize = 20,
      gap = 4,
      iconPosition = 'left',
      iconColor = 'currentColor',
      children,
    }: CopyHelperProps,
    ref
  ) => {
    const [isCopied, setCopied] = useCopyClipboard()
    const copy = useCallback(() => {
      setCopied(toCopy)
    }, [toCopy, setCopied])

    useImperativeHandle(ref, () => ({
      forceCopy() {
        copy()
      },
    }))

    // Detects is text is ellipsing in order to shorten gap caused by extra space browsers add after ... chars
    const textRef = useRef<HTMLDivElement>(null)
    const isEllipsis = isEllipsisActive(textRef.current)
    const displayGap = isEllipsis ? gap - 4 : gap

    const [isHover, setIsHover] = useState(false)
    const onHover = useCallback(() => setIsHover(true), [])
    const offHover = useCallback(() => setIsHover(false), [])

    // Copy-helpers w/ left icon always show icon & display "Copied!" in copied state
    // Copy-helpers w/ right icon show icon on hover & do not change text
    const showIcon = Boolean(iconPosition === 'left' || isHover || isCopied)
    const Icon = isCopied ? CopiedIcon : showIcon ? InitialIcon : null
    const offset = showIcon ? gap + iconSize : 0
    return (
      <CopyHelperContainer
        onClick={copy}
        color={color}
        clicked={isCopied}
        gap={displayGap}
        onMouseEnter={onHover}
        onMouseLeave={offHover}
      >
        {iconPosition === 'left' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
        <CopyHelperText ref={textRef} fontSize={fontSize} offset={offset}>
          {isCopied && iconPosition === 'left' ? <Trans>Copied!</Trans> : children}
        </CopyHelperText>
        <div style={{ clear: 'both' }} />
        {iconPosition === 'right' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
      </CopyHelperContainer>
    )
  }
)
CopyHelper.displayName = 'CopyHelper'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`
const SpinnerCss = css`
  animation: 2s ${rotate} linear infinite;
`

const Spinner = styled.img`
  ${SpinnerCss}
  width: 16px;
  height: 16px;
`
export const SpinnerSVG = styled.svg`
  ${SpinnerCss}
`

const BackArrowIcon = styled(ArrowLeft)`
  color: ${({ theme }) => theme.textPrimary};
`

export function BackArrowLink({ to }: { to: string }) {
  return (
    <StyledInternalLink to={to}>
      <BackArrowIcon />
    </StyledInternalLink>
  )
}

export const CustomLightSpinner = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

export const HideSmall = styled.span`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: none;
  `};
`

export const HideExtraSmall = styled.span`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    display: none;
  `};
`

export const SmallOnly = styled.span`
  display: none;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    display: block;
  `};
`

export const MediumOnly = styled.span`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    display: block;
  }
`

export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.backgroundOutline};
`

export const GlowEffect = styled.div`
  border-radius: 32px;
  box-shadow: ${({ theme }) => theme.networkDefaultShadow};
`

export const CautionTriangle = styled(AlertTriangle)`
  color: ${({ theme }) => theme.accentWarning};
`

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.backgroundOutline};
`
