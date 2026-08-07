/**
 * Inline twins of the two `ui/src` generated icons the legacy
 * DropdownMenuSheetItem renders (`CheckCircleFilled`, `ExternalLink`), copied
 * from their SVG sources in `packages/ui/src/assets/icons/`. mycelium cannot
 * import the Tamagui icon pipeline; these carry the identical paths and take
 * a raw pixel size + CSS color expression instead of theme tokens.
 */
import type { JSX } from 'react'

interface MenuGlyphProps {
  size: number
  /** Any CSS color expression (`var(--stext-neutral2)`, `#fff`); defaults to currentColor. */
  color?: string
  'data-slot'?: string
}

/** packages/ui/src/assets/icons/check-circle-filled.svg */
export function CheckCircleFilledGlyph({ size, color, ...rest }: MenuGlyphProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={color === undefined ? undefined : { color }}
      aria-hidden
      {...rest}
    >
      <path
        d="M9.99996 1.66699C5.39996 1.66699 1.66663 5.40033 1.66663 10.0003C1.66663 14.6003 5.39996 18.3337 9.99996 18.3337C14.6 18.3337 18.3333 14.6003 18.3333 10.0003C18.3333 5.40033 14.6 1.66699 9.99996 1.66699ZM13.3583 8.50034L9.46661 12.3836C9.34995 12.5086 9.19162 12.567 9.02495 12.567C8.86662 12.567 8.70828 12.5086 8.58328 12.3836L6.64163 10.442C6.39996 10.2004 6.39996 9.8003 6.64163 9.55863C6.88329 9.31697 7.28329 9.31697 7.52496 9.55863L9.02495 11.0587L12.475 7.617C12.7166 7.367 13.1166 7.367 13.3583 7.617C13.6 7.85867 13.6 8.25034 13.3583 8.50034Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** packages/ui/src/assets/icons/external-link.svg */
export function ExternalLinkGlyph({ size, color, ...rest }: MenuGlyphProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={color === undefined ? undefined : { color }}
      aria-hidden
      {...rest}
    >
      <path
        d="M21 4V9C21 9.552 20.553 10 20 10C19.447 10 19 9.552 19 9V6.41406L11.707 13.707C11.512 13.902 11.256 14 11 14C10.744 14 10.488 13.902 10.293 13.707C9.90197 13.316 9.90197 12.684 10.293 12.293L17.5859 5H15C14.447 5 14 4.552 14 4C14 3.448 14.447 3 15 3H20C20.13 3 20.2601 3.0269 20.3821 3.0769C20.6271 3.1779 20.8221 3.37292 20.9231 3.61792C20.9741 3.73992 21 3.87 21 4ZM20 12C19.447 12 19 12.448 19 13V17C19 18.439 18.439 19 17 19H7C5.561 19 5 18.439 5 17V7C5 5.561 5.561 5 7 5H11C11.553 5 12 4.552 12 4C12 3.448 11.553 3 11 3H7C4.458 3 3 4.458 3 7V17C3 19.542 4.458 21 7 21H17C19.542 21 21 19.542 21 17V13C21 12.448 20.553 12 20 12Z"
        fill="currentColor"
      />
    </svg>
  )
}
