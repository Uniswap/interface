import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { noop } from 'utilities/src/react/noop'

/**
 * Hook uses to calculate the number of seconds remaining until the deadline and return
 * the title of the step if the deadline has been reached.
 */
export function useSecondsUntilDeadline(
  deadline: number | undefined,
  status: StepStatus,
): { secondsRemaining: number | undefined; ranOutOfTimeTitle: string | undefined } {
  const [secondsRemaining, setSecondsRemaining] = useState<number>()
  const { t } = useTranslation()

  useEffect(() => {
    if (!deadline || status !== StepStatus.Active) {
      setSecondsRemaining(undefined)
      return noop
    }

    const secondsUntilDeadline = deadline - Math.floor(Date.now() / 1000)
    if (secondsUntilDeadline <= 0) {
      return noop
    }

    setSecondsRemaining(secondsUntilDeadline)

    const timer = setInterval(() => {
      setSecondsRemaining((prevSecondsRemaining) => {
        if (!prevSecondsRemaining) {
          clearInterval(timer)
          return prevSecondsRemaining
        }

        return prevSecondsRemaining - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline, status])

  const active = status === StepStatus.Active
  const ranOutOfTimeTitle = active && deadline && !secondsRemaining ? t('common.confirmTimedOut') : undefined

  return { secondsRemaining, ranOutOfTimeTitle }
}
