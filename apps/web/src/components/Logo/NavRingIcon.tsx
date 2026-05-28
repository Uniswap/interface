import { SVGProps, useMemo } from 'react'
import { Flex, styled } from 'ui/src'

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <svg
      width="48"
      height="48"
      data-testid="ring-logo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-50 -30 180 160"
      onClick={onClick}
    >
      <defs>
        <linearGradient id="linear-gradient" x1={6.17} y1={54.34} x2={78.28} y2={54.34} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor="#f15266" />
          <stop offset={0.52} stopColor="#bc74ed" />
          <stop offset={1} stopColor="#1abee9" />
        </linearGradient>

        <linearGradient id="linear-gradient-2" x1={59.26} y1={20.49} x2={92.87} y2={20.49} href="#linear-gradient" />
      </defs>
      <path
        fill="url(#linear-gradient)"
        d="M42.27,90.41a36.07,36.07,0,1,1,36-36.21A36,36,0,0,1,42.27,90.41ZM16,54.38c-.22,14.07,11.52,26,25.82,26.2A26.25,26.25,0,1,0,16,54.38Z"
        transform="translate(-6.17 -3.72)"
      />
      <path
        fill="url(#linear-gradient-2)"
        d="M59.26,10.33l6.89-6.61L92.87,30.5l-7,6.75Z"
        transform="translate(-6.17 -3.72)"
      />
    </svg>
  )
}

function HolidayLogo({ onClick }: { onClick?: () => void }) {
  return (
    <svg
      width="48"
      height="48"
      data-testid="ring-logo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-50 -30 180 160"
      onClick={onClick}
    >
      <defs>
        <linearGradient id="linear-gradient" x1={6.17} y1={54.34} x2={78.28} y2={54.34} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor="#f15266" />
          <stop offset={0.52} stopColor="#bc74ed" />
          <stop offset={1} stopColor="#1abee9" />
        </linearGradient>

        <linearGradient id="linear-gradient-2" x1={59.26} y1={20.49} x2={92.87} y2={20.49} href="#linear-gradient" />
      </defs>
      <path
        fill="url(#linear-gradient)"
        d="M42.27,90.41a36.07,36.07,0,1,1,36-36.21A36,36,0,0,1,42.27,90.41ZM16,54.38c-.22,14.07,11.52,26,25.82,26.2A26.25,26.25,0,1,0,16,54.38Z"
        transform="translate(-6.17 -3.72)"
      />
      <path
        fill="url(#linear-gradient-2)"
        d="M59.26,10.33l6.89-6.61L92.87,30.5l-7,6.75Z"
        transform="translate(-6.17 -3.72)"
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

export const NavRingIcon = ({ clickable, onClick }: NavIconProps) => {
  const showHolidayUni = useMemo(() => {
    const date = new Date()
    // months in javascript are 0 indexed...
    const month = date.getMonth() + 1
    const day = date.getDate()
    return month === 12 || (month === 1 && day <= 7)
  }, [])

  return (
    <Container clickable={clickable}>
      {showHolidayUni ? <HolidayLogo onClick={onClick} /> : <Logo onClick={onClick} />}
    </Container>
  )
}
