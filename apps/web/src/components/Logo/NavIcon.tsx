import { SVGProps, useMemo } from 'react'
import { Flex, styled } from 'ui/src'

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <img
      src="/images/juiceswap/Juice-swap-Logo.svg"
      alt="JuiceSwap"
      width="20"
      height="20"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    />
  )
}

function HolidayLogo({ onClick }: { onClick?: () => void }) {
  return (
    <img
      src="/images/juiceswap/Juice-swap-Logo.svg"
      alt="JuiceSwap Holiday"
      width="32"
      height="32"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    />
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
