import React, { useMemo } from 'react'

import { cn } from '../cn'
import { COLOR_COUNT } from './colors'
import { hashString } from './hash'
import { type IconPaths, Icons } from './icons'

export interface UniconProps {
  /** Any string for deterministic avatar generation */
  input: string
  /** Size in pixels (default: 32) */
  size?: number
  /** Additional CSS classes */
  className?: string
  /** Custom icon to render instead of the default generated icon. Will be colored with the computed unicon color. */
  icon?: React.ReactNode
}

/**
 * Deterministic avatar component that generates a unique visual identity
 * based on any input string (e.g., wallet address, username, email).
 *
 * Colors automatically adapt to light/dark mode via CSS variables.
 *
 * @example
 * ```tsx
 * <Unicon input="0x1234..." size={48} />
 * <Unicon input="user@example.com" size={32} className="border border-neutral1" />
 * ```
 */
export function Unicon({ input, size = 32, className, icon }: UniconProps): React.ReactElement {
  const { colorVar, paths } = useMemo(() => {
    const hash = hashString(input)
    const iconKeys = Object.keys(Icons)

    // Use BigInt modulo for both to avoid precision loss when converting to Number
    const colorIndex = Number(hash % BigInt(COLOR_COUNT))
    const iconIndex = Number(hash % BigInt(iconKeys.length))

    return {
      colorVar: `var(--unicon-${colorIndex})`,
      paths: Icons[iconKeys[iconIndex] as keyof typeof Icons] as IconPaths,
    }
  }, [input])

  const scale = (size / 48 / 1.5) * 0.9
  const scaledSize = 48 * scale
  const translate = (size - scaledSize) / 2

  // For custom icons, center them at ~40% of the container size
  const iconSize = Math.round(size * 0.4)
  const iconOffset = (size - iconSize) / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cn('shrink-0', className)}>
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={colorVar} opacity="var(--unicon-bg-opacity)" />
      {icon ? (
        <foreignObject x={iconOffset} y={iconOffset} width={iconSize} height={iconSize}>
          {/* biome-ignore lint/correctness/noRestrictedElements: div required inside SVG foreignObject */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colorVar,
            }}
          >
            {icon}
          </div>
        </foreignObject>
      ) : (
        <g transform={`translate(${translate}, ${translate}) scale(${scale})`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill={colorVar} clipRule="evenodd" fillRule="evenodd" />
          ))}
        </g>
      )}
    </svg>
  )
}
