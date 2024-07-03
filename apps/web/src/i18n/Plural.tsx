import { Translation } from 'react-i18next'
import { isTestEnv } from 'utilities/src/environment'

export function Plural({ value, one, other }: { value: number; one: string; other: string }) {
  const children = value === 1 ? one : other
  if (isTestEnv()) {
    return <>{children}</>
  }
  // ensures it re-renders when language changes
  return <Translation>{() => children}</Translation>
}
