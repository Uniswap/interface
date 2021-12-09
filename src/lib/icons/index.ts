/* eslint-disable no-restricted-imports */
import styled, { Color } from 'lib/theme'
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
  HelpCircle as HelpCircleIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Trash2 as Trash2Icon,
  X as XIcon,
} from 'react-feather'

function icon(FeatherIcon: FeatherIcon) {
  return styled(FeatherIcon)<{ color?: Color }>`
    clip-path: stroke-box;
    height: 1em;
    stroke: ${({ color = 'currentColor', theme }) => theme[color]};
    width: 1em;
  `
}

export type Icon = ReturnType<typeof icon>

export const X = icon(XIcon)
export const AlertTriangle = icon(AlertTriangleIcon)
export const CheckCircle = icon(CheckCircleIcon)
export const Trash2 = icon(Trash2Icon)
export const HelpCircle = icon(HelpCircleIcon)
export const Clock = icon(ClockIcon)
export const ArrowDown = icon(ArrowDownIcon)
export const ArrowUp = icon(ArrowUpIcon)
export const ArrowRight = icon(ArrowRightIcon)
export const Info = icon(InfoIcon)
export const ChevronUp = icon(ChevronUpIcon)
export const Settings = icon(SettingsIcon)
export const ChevronDown = icon(ChevronDownIcon)
