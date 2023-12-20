import { ReactElement } from 'react'
import styled from 'styled-components'

import SantaHat from '../../assets/images/santa-hat.png'

const SantaHatImage = styled.img`
  position: absolute;
  top: 5px;
  right: 6px;
  height: 18px;
`

const Christmas = <SantaHatImage src={SantaHat} alt="Santa hat" />

const MONTH_TO_ORNAMENT: { [date: string]: ReactElement } = {
  '12': Christmas,
}

export default function HolidayOrnament() {
  // months in javascript are 0 indexed...
  const currentMonth = `${new Date().getMonth() + 1}`
  return MONTH_TO_ORNAMENT[currentMonth] || null
}
