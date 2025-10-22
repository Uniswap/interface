import Row from 'components/deprecated/Row'
import Expand from 'components/Expand'
import QuestionHelper from 'components/QuestionHelper'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import ms from 'ms'
import { Input, InputContainer } from 'pages/MigrateV2/Settings/Input'
import { useState } from 'react'
import { Trans } from 'react-i18next'
import { useUserTransactionTTL } from 'state/user/hooks'
import { ThemedText } from 'theme/components'

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const THREE_DAYS_IN_SECONDS = ms(`3d`) / 1000
const NUMBERS_ONLY = /^[0-9\b]+$/

export default function TransactionDeadlineSettings() {
  const [deadline, setDeadline] = useUserTransactionTTL()

  const defaultInputValue = deadline && deadline !== DEFAULT_DEADLINE_FROM_NOW ? (deadline / 60).toString() : ''

  // If user has previously entered a custom deadline, we want to show that value in the input field
  // instead of a placeholder by defualt
  const [deadlineInput, setDeadlineInput] = useState(defaultInputValue)
  const [deadlineError, setDeadlineError] = useState<DeadlineError | false>(false)

  // If user has previously entered a custom deadline, we want to show the settings expanded by default.
  const [isOpen, setIsOpen] = useState(defaultInputValue.length > 0)

  function parseCustomDeadline(value: string) {
    // Do not allow non-numerical characters in the input field
    if (value.length > 0 && !NUMBERS_ONLY.test(value)) {
      return
    }

    setDeadlineInput(value)
    setDeadlineError(false)

    // If the input is empty, set the deadline to the default
    if (value.length === 0) {
      setDeadline(DEFAULT_DEADLINE_FROM_NOW)
      return
    }

    // Parse user input and set the deadline if valid, error otherwise
    try {
      const parsed: number = Number.parseInt(value) * 60
      if (parsed === 0 || parsed > THREE_DAYS_IN_SECONDS) {
        setDeadlineError(DeadlineError.InvalidInput)
      } else {
        setDeadline(parsed)
      }
    } catch {
      setDeadlineError(DeadlineError.InvalidInput)
    }
  }

  return (
    <Expand
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      padding="6px 0px"
      testId="transaction-deadline-settings"
      header={
        <Row width="auto">
          <ThemedText.BodyPrimary>
            <Trans i18nKey="swap.transaction.deadline" />
          </ThemedText.BodyPrimary>
          <QuestionHelper text={<Trans i18nKey="swap.transaction.revertAfter" />} />
        </Row>
      }
      button={<Trans i18nKey="common.time.minute.amt" values={{ time: deadline / 60 }} />}
    >
      <Row>
        <InputContainer gap="md" error={!!deadlineError}>
          <Input
            data-testid="deadline-input"
            placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
            value={deadlineInput}
            onChange={(e) => parseCustomDeadline(e.target.value)}
            onBlur={() => {
              // When the input field is blurred, reset the input field to the current deadline
              setDeadlineInput(defaultInputValue)
              setDeadlineError(false)
            }}
          />
          <ThemedText.BodyPrimary>
            <Trans i18nKey="common.time.minutes" />
          </ThemedText.BodyPrimary>
        </InputContainer>
      </Row>
    </Expand>
  )
}
