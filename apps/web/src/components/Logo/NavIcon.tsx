import { SVGProps } from 'react'
import { Flex, styled, useSporeColors } from 'ui/src'

/**
 * HookSwap hex mark — pointy-top hexagon outline with an open "hook" ring inside.
 * Ported from the Terminal HookLogo glyph (`~/terminal/components/HookLogo.tsx`)
 * so the legacy header shows the HookSwap brand instead of the Uniswap unicorn.
 *
 * Rendered single-colour (inherits the passed accent colour) to match the
 * adjacent "HookSwap" wordmark, which the header draws in `$accent1`.
 */
function HookMark({ color, onClick }: { color: string; onClick?: () => void }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 48 48"
      fill="none"
      onClick={onClick}
      cursor="pointer"
    >
      <path
        d="M24 3.5 L41.8 13.75 L41.8 34.25 L24 44.5 L6.2 34.25 L6.2 13.75 Z"
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <circle
        cx={24}
        cy={25}
        r={7.2}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray="33 13"
        transform="rotate(118 24 25)"
      />
    </svg>
  )
}

const Container = styled(Flex, {
  position: 'relative',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'auto',
  variants: {
    clickable: {
      true: { cursor: 'pointer' },
    },
  },
})

type NavIconProps = SVGProps<SVGSVGElement> & {
  clickable?: boolean
  onClick?: () => void
}

export const NavIcon = ({ clickable, onClick }: NavIconProps) => {
  const colors = useSporeColors()

  return (
    <Container clickable={clickable}>
      <HookMark color={colors.accent1.val} onClick={onClick} />
    </Container>
  )
}
