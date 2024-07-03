import { ReactComponent as WinterUni } from 'assets/svg/winter-uni.svg'
import { SVGProps } from 'components/Logo/UniIcon'
import { t } from 'i18n'
import { ReactElement } from 'react'

const MONTH_TO_HOLIDAY_UNI: { [date: string]: (props: SVGProps) => ReactElement } = {
  '12': (props) => <WinterUni title={t('common.happyHolidays')} {...props} />,
  '1': (props) => <WinterUni {...props} />,
}

export default function HolidayUniIcon(props: SVGProps): ReactElement | null {
  // months in javascript are 0 indexed...
  const currentMonth = `${new Date().getMonth() + 1}`
  const HolidayUni = MONTH_TO_HOLIDAY_UNI[currentMonth]
  return HolidayUni ? <HolidayUni {...props} /> : null
}
