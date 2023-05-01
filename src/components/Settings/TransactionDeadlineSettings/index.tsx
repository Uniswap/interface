import { Trans } from '@lingui/macro'
import Expand from 'components/Expand'
import QuestionHelper from 'components/QuestionHelper'
import Row from 'components/Row'
import { Input, InputContainer } from 'components/Settings/Input'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import ms from 'ms.macro'
import React, { useState } from 'react'
import { useUserTransactionTTL } from 'state/user/hooks'
import { ThemedText } from 'theme'

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const THREE_DAYS_IN_SECONDS = ms`3 days` / 1000
const NUMBERS_ONLY = /^[0-9\b]+$/

export default function TransactionDeadlineSettings() {
  const [deadline, setDeadline] = useUserTransactionTTL()

  // If user has set a custom deadline, we want to show that value in the input field
  // instead of a placeholder by defualt
  const [deadlineInput, setDeadlineInput] = useState(
    deadline && deadline !== DEFAULT_DEADLINE_FROM_NOW ? (deadline / 60).toString() : ''
  )
  const [deadlineError, setDeadlineError] = useState<DeadlineError | false>(false)

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
      if (parsed < 60 || parsed > THREE_DAYS_IN_SECONDS) {
        setDeadlineError(DeadlineError.InvalidInput)
      } else {
        setDeadline(parsed)
      }
    } catch (error) {
      setDeadlineError(DeadlineError.InvalidInput)
    }
  }

  return (
    <Expand
      header={
        <Row width="auto">
          <ThemedText.BodySecondary>
            <Trans>Transaction deadline</Trans>
          </ThemedText.BodySecondary>
          <QuestionHelper
            text={<Trans>Your transaction will revert if it is pending for more than this period of time.</Trans>}
          />
        </Row>
      }
      button={<Trans>{deadline / 60}</Trans>}
    >
      <Row>
        <InputContainer gap="md" error={!!deadlineError}>
          <Input
            placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
            value={deadlineInput}
            onChange={(e) => parseCustomDeadline(e.target.value)}
          />
          <ThemedText.BodyPrimary>
            <Trans>minutes</Trans>
          </ThemedText.BodyPrimary>
        </InputContainer>
      </Row>
    </Expand>
  )
}
