import { SVGProps, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, useSporeColors } from 'ui/src'

function Logo({ color, onClick }: { color: string; onClick?: () => void }) {
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

function HolidayLogo({ color, onClick }: { color: string; onClick?: () => void }) {
  const { t } = useTranslation()

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
  const colors = useSporeColors()
  const showHolidayUni = useMemo(() => {
    const date = new Date()
    // months in javascript are 0 indexed...
    const month = date.getMonth() + 1
    const day = date.getDate()
    return month === 12 || (month === 1 && day <= 7)
  }, [])

  return (
    <Container clickable={clickable}>
      {showHolidayUni ? (
        <HolidayLogo color={colors.accent1.val} onClick={onClick} />
      ) : (
        <Logo color={colors.accent1.val} onClick={onClick} />
      )}
    </Container>
  )
}
