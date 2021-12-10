/* eslint-disable no-restricted-imports */
import CheckIcon from 'lib/assets/Check'
import styled, { Color, css } from 'lib/theme'
import { FunctionComponent, SVGProps } from 'react'
import { Icon as FeatherIcon } from 'react-feather'
import {
  AlertTriangle as AlertTriangleIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  CheckCircle as CheckCircleIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Clock as ClockIcon,
  CreditCard as CreditCardIcon,
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
} from 'react-feather'

export { default as Logo } from 'lib/assets/Logo'

type SVGIcon = FunctionComponent<SVGProps<SVGSVGElement>>

function icon(Icon: FeatherIcon | SVGIcon) {
  return styled(Icon)<{ color?: Color }>`
    clip-path: stroke-box;
    height: 1em;
    stroke: ${({ color = 'currentColor', theme }) => theme[color]};
    width: 1em;
  `
}

export type Icon = ReturnType<typeof icon>

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
  ${largeIconCss}
`

interface LargeIconProps {
  icon: Icon
  size?: number
}

export function LargeIcon({ icon: Icon, size = 1.2 }: LargeIconProps) {
  return (
    <LargeWrapper iconSize={size}>
      <Icon />
    </LargeWrapper>
  )
}

export const AlertTriangle = icon(AlertTriangleIcon)
export const ArrowDown = icon(ArrowDownIcon)
export const ArrowRight = icon(ArrowRightIcon)
export const ArrowUp = icon(ArrowUpIcon)
export const CheckCircle = icon(CheckCircleIcon)
export const ChevronDown = icon(ChevronDownIcon)
export const ChevronUp = icon(ChevronUpIcon)
export const Clock = icon(ClockIcon)
export const CreditCard = icon(CreditCardIcon)
export const HelpCircle = icon(HelpCircleIcon)
export const Info = icon(InfoIcon)
export const Settings = icon(SettingsIcon)
export const Trash2 = icon(Trash2Icon)
export const X = icon(XIcon)

export const Check = styled(icon(CheckIcon))`
  circle {
    fill: ${({ theme }) => theme.active};
    stroke: none;
  }
`
