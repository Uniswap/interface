import { Translation } from 'react-i18next'
import { PluralProps } from 'uniswap/src/i18n/shared'
import { isTestEnv } from 'utilities/src/environment/env'

export function Plural({ value, one, other }: PluralProps): JSX.Element {
  const children = value === 1 ? one : other
  if (isTestEnv()) {
    return <>{children}</>
  }
  // ensures it re-renders when language changes
  return <Translation>{() => children}</Translation>
}
