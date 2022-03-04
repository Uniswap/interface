import MissingTokenIcon from 'lib/assets/missing-token-image.png'
import { ReactComponent as RouterIcon } from 'lib/assets/svg/auto_router.svg'
import { ReactComponent as CheckIcon } from 'lib/assets/svg/check.svg'
import { ReactComponent as ExpandoIcon } from 'lib/assets/svg/expando.svg'
import { ReactComponent as InlineSpinnerIcon } from 'lib/assets/svg/inline_spinner.svg'
import { ReactComponent as LogoIcon } from 'lib/assets/svg/logo.svg'
import { ReactComponent as SpinnerIcon } from 'lib/assets/svg/spinner.svg'
import { ReactComponent as WalletIcon } from 'lib/assets/svg/wallet.svg'
import styled, { Color, css, keyframes } from 'lib/theme'
import { FunctionComponent, SVGProps } from 'react'
/* eslint-disable no-restricted-imports */
import { Icon as FeatherIcon } from 'react-feather'
import {
  AlertTriangle as AlertTriangleIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  BarChart2 as BarChart2Icon,
  CheckCircle as CheckCircleIcon,
  ChevronDown as ChevronDownIcon,
  Clock as ClockIcon,
  ExternalLink as LinkIcon,
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Slash as SlashIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
  XOctagon as XOctagonIcon,
} from 'react-feather'
/* eslint-enable no-restricted-imports */

type SVGIcon = FunctionComponent<SVGProps<SVGSVGElement>>

const StyledImage = styled.img`
  height: 1em;
  width: 1em;
`
function icon(Icon: FeatherIcon | SVGIcon) {
  return styled(Icon)<{ color?: Color }>`
    clip-path: stroke-box;
    height: 1em;
    stroke: ${({ color = 'currentColor', theme }) => theme[color]};
    width: 1em;
  `
}

export const largeIconCss = css<{ iconSize: number }>`
  display: flex;

  svg {
    align-self: center;
    height: ${({ iconSize }) => iconSize}em;
    width: ${({ iconSize }) => iconSize}em;
  }
`

const LargeWrapper = styled.div<{ iconSize: number }>`
  height: 1em;
  width: ${({ iconSize }) => iconSize}em;
  ${largeIconCss}
`

export type Icon = ReturnType<typeof icon> | typeof LargeIcon

interface LargeIconProps {
  icon?: Icon
  color?: Color
  size?: number
  className?: string
}

export function LargeIcon({ icon: Icon, color, size = 1.2, className }: LargeIconProps) {
  return (
    <LargeWrapper color={color} iconSize={size} className={className}>
      {Icon && <Icon color={color} />}
    </LargeWrapper>
  )
}

export const AlertTriangle = icon(AlertTriangleIcon)
export const ArrowDown = icon(ArrowDownIcon)
export const ArrowRight = icon(ArrowRightIcon)
export const ArrowUp = icon(ArrowUpIcon)
export const CheckCircle = icon(CheckCircleIcon)
export const BarChart = icon(BarChart2Icon)
export const ChevronDown = icon(ChevronDownIcon)
export const Clock = icon(ClockIcon)
export const HelpCircle = icon(HelpCircleIcon)
export const Info = icon(InfoIcon)
export const Link = icon(LinkIcon)
export const AutoRouter = icon(RouterIcon)
export const Settings = icon(SettingsIcon)
export const Slash = icon(SlashIcon)
export const Trash2 = icon(Trash2Icon)
export const Wallet = icon(WalletIcon)
export const X = icon(XIcon)
export const XOctagon = icon(XOctagonIcon)
export const MissingToken = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <StyledImage src={MissingTokenIcon} alt="Missing token" {...props} />
)

export const Check = styled(icon(CheckIcon))`
  circle {
    fill: ${({ theme }) => theme.active};
    stroke: none;
  }
`

export const Expando = styled(icon(ExpandoIcon))<{ open: boolean }>`
  path {
    transition: transform 0.25s ease-in-out;
    will-change: transform;

    &:first-child {
      transform: ${({ open }) => open && 'translateX(-25%)'};
    }

    &:last-child {
      transform: ${({ open }) => open && 'translateX(25%)'};
    }
  }
`

export const Logo = styled(icon(LogoIcon))`
  fill: ${({ theme }) => theme.secondary};
  stroke: none;
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled(icon(SpinnerIcon))<{ color?: Color }>`
  animation: 2s ${rotate} linear infinite;
  stroke: ${({ color = 'active', theme }) => theme[color]};
  stroke-linecap: round;
  stroke-width: 2;
`

export const InlineSpinner = styled(icon(InlineSpinnerIcon))<{ color?: Color }>`
  animation: ${rotate} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  color: ${({ color = 'active', theme }) => theme[color]};
  fill: ${({ theme }) => theme.outline};
  stroke: ${({ theme }) => theme.outline};
  stroke-linecap: round;
`
