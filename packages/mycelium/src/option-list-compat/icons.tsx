/**
 * The option-list compat's search glyph (INFRA-3021 dropdown set): a stroked
 * magnifier with no generated-icon twin.
 */
import type * as React from 'react'

interface GlyphProps extends Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number
}

/** Search magnifier for the filter input, currentColor-driven. */
export function SearchGlyph({ size = 20, ...rest }: GlyphProps): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
