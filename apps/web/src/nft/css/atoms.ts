import clsx from 'clsx'
import * as resetStyles from 'nft/css/reset.css'
import { Sprinkles, sprinkles } from 'nft/css/sprinkles.css'

export interface Atoms extends Sprinkles {
  // reset is used by the Box component when its expected to behave as something other than a div, ie button, a, or span
  reset?: keyof JSX.IntrinsicElements
}

export const atoms = ({ reset, ...rest }: Atoms) => {
  if (!reset) {
    return sprinkles(rest)
  }

  const elementReset = resetStyles.element[reset as keyof typeof resetStyles.element]

  const sprinklesClasses = sprinkles(rest)

  return clsx(resetStyles.base, elementReset, sprinklesClasses)
}
