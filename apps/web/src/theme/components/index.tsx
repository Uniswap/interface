import { InterfaceEventName } from '@uniswap/analytics-events'
import { ReactComponent as TooltipTriangle } from 'assets/svg/tooltip_triangle.svg'
import useCopyClipboard from 'hooks/useCopyClipboard'
import styled, { css, keyframes } from 'lib/styled-components'
import React, {
  HTMLProps,
  PropsWithChildren,
  ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { AlertTriangle, CheckCircle, Copy, Icon } from 'react-feather'
import { Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Z_INDEX } from 'theme/zIndex'
import { Flex, FlexProps, TextProps, TextStyle, isTouchable } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { anonymizeLink } from 'utils/anonymizeLink'

// TODO: Break this file into a components folder

export { ThemedText } from './text'

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

  @media (hover: hover) and (pointer: fine) {
    :hover {
      opacity: ${({ theme }) => theme.opacity.hover};
    }
  }

  :focus {
    text-decoration: underline;
  }
`

/** @deprecated use tamagui and EllipsisTamaguiStyle instead */
export const EllipsisStyle = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const EllipsisTamaguiStyle = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} satisfies TextStyle

/** @deprecated use tamagui and ClickableTamaguiStyle instead */
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
export const ClickableTamaguiStyle = {
  cursor: 'pointer',
  '$platform-web': {
    textDecoration: 'none',
    transitionDuration: '0.2s',
  },
  hoverStyle: {
    opacity: 0.8,
  },
  pressStyle: {
    opacity: 0.6,
  },
} satisfies FlexProps

export const TamaguiClickableStyle = {
  textDecorationLine: 'none',
  cursor: 'pointer',
  // Tamagui bug. Animation property breaks theme value transition, must use style instead
  style: { transition: '100ms' },
  hoverStyle: {
    opacity: 0.6,
  },
} satisfies TextProps

const LinkStyle = css`
  color: ${({ theme }) => theme.accent1};
  stroke: ${({ theme }) => theme.accent1};
  font-weight: 500;
`

// An internal link from the react-router-dom library that is correctly styled
export const StyledInternalLink = styled(Link)`
  ${ClickableStyle}
  ${LinkStyle}
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

function outboundLink({ label }: { label: string }) {
  sendAnalyticsEvent(InterfaceEventName.EXTERNAL_LINK_CLICK, {
    label,
  })
}

function handleClickExternalLink(event: React.MouseEvent<HTMLAnchorElement>) {
  const { target, href } = event.currentTarget

  const anonymizedHref = anonymizeLink(href)

  // don't prevent default, don't redirect if it's a new tab
  if (target === '_blank' || event.ctrlKey || event.metaKey) {
    outboundLink({ label: anonymizedHref })
  } else {
    event.preventDefault()
    // send a ReactGA event and then trigger a location change
    outboundLink({ label: anonymizedHref })
  }
}

const StyledLink = styled.a`
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
}: Omit<HTMLProps<HTMLAnchorElement>, 'as' | 'ref'> & { href: string }) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      handleClickExternalLink(event)
      if (rest.onClick) {
        rest.onClick(event)
      }
    },
    [rest],
  )
  return <StyledLink target={target} rel={rel} href={href} onClick={handleClick} {...rest} />
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
      <CopiedTooltip isCopyContractTooltip={isCopyContractTooltip}>Copied</CopiedTooltip>
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
  color: ${({ theme }) => theme.success};
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

type CopyHelperRefType = { forceCopy: () => void }
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
    ref,
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
    const showIcon = Boolean(iconPosition === 'left' || isHover || isTouchable || isCopied)
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
          {isCopied && iconPosition === 'left' ? <Trans i18nKey="common.copied" /> : children}
        </CopyHelperText>
        <Flex $platform-web={{ clear: 'both' }} />
        {iconPosition === 'right' && Icon && <Icon size={iconSize} strokeWidth={1.5} color={iconColor} />}
      </CopyHelperContainer>
    )
  },
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

export const CustomLightSpinner = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

export const MediumOnly = styled.span`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: block;
  }
`

export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.surface3};
`

export const CautionTriangle = styled(AlertTriangle)`
  color: ${({ theme }) => theme.deprecated_accentWarning};
`

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.surface3};
`
