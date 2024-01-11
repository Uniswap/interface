import { t } from '@lingui/macro'
import { ReactElement } from 'react'

import { ReactComponent as WinterUni } from '../../assets/svg/winter-uni.svg'
import { SVGProps } from './UniIcon'

const MONTH_TO_HOLIDAY_UNI: { [date: string]: (props: SVGProps) => ReactElement } = {
  '12': (props) => <WinterUni title={t`Happy Holidays from the Uniswap team!`} {...props} />,
  '1': (props) => <WinterUni {...props} />,
}

export default function HolidayUniIcon(props: SVGProps): ReactElement | null {
  // months in javascript are 0 indexed...
  const currentMonth = `${new Date().getMonth() + 1}`
  const HolidayUni = MONTH_TO_HOLIDAY_UNI[currentMonth]
  return HolidayUni ? <HolidayUni {...props} /> : null
}
