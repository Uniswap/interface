import { ButtonPrimary } from 'components/Button'
import { DarkGrayCard } from 'components/Card'
import Column from 'components/Column'
import Modal from 'components/Modal'
import NumericalInputPanel from 'components/NumericalInputPanel'
import Row, { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { Trans } from 'i18n'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { Action, ActionSelector } from './ActionSelector'

const ModalWrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
  gap: 12px;
`

const HeaderRow = styled(RowBetween)`
  display: flex;
  margin-bottom: 20px;
`

export interface TokenDistributionParams {
  releaseIntervalDays: string
  releaseDurationDays: string
  cliffDurationDays: string
  initialReleaseRate: string
  cliffReleaseRate: string
}

function isZero(input: string) {
  input = input.trim()
  return input == '' || input == '0'
}

export default function TokenDistributionModal({
  isOpen,
  initialParams,
  onDismiss,
  onSubmit,
}: {
  isOpen: boolean
  initialParams: TokenDistributionParams
  onDismiss: () => void
  onSubmit: (info: TokenDistributionParams) => void
}) {
  const onClose = () => {
    if (onDismiss) {
      onDismiss()
    }
  }

  // Form state
  const [vestingEnabled, setVestingEnabled] = useState(!isZero(initialParams.releaseDurationDays))
  const [cliffEnabled, setCliffEnabled] = useState(!isZero(initialParams.cliffDurationDays))
  const [initialReleaseRate, setInitialReleaseRate] = useState(
    vestingEnabled && cliffEnabled ? '100' : initialParams.initialReleaseRate
  )
  const [releaseIntervalDays, setReleaseIntervalDays] = useState(initialParams.releaseIntervalDays || '1')
  const [releaseDuration, setReleaseDuration] = useState(
    vestingEnabled
      ? Math.floor(parseFloat(initialParams.releaseDurationDays) / parseFloat(releaseIntervalDays)).toString()
      : '0'
  )
  const [cliffDurationDays, setCliffDurationDays] = useState(cliffEnabled ? initialParams.cliffDurationDays : '0')
  const [cliffReleaseRate, setCliffReleaseRate] = useState(initialParams.cliffReleaseRate || '0')

  useEffect(() => {
    if (!vestingEnabled && !cliffEnabled) {
      setInitialReleaseRate('100')
      setCliffReleaseRate('0')
      setCliffDurationDays('0')
      setReleaseDuration('0')
    } else {
      if (initialReleaseRate == '100') {
        setInitialReleaseRate('50')
      }
      if (!vestingEnabled) {
        setReleaseDuration('0')
      }
      if (!cliffEnabled) {
        setCliffReleaseRate('0')
        setCliffDurationDays('0')
      }
    }
  }, [vestingEnabled, cliffEnabled, initialReleaseRate])

  const releaseIntervals: Action[] = [
    {
      id: '1',
      name: 'Daily',
    },
    {
      id: '7',
      name: 'Weekly',
    },
    {
      id: '30',
      name: 'Monthly',
    },
  ]

  // Validation states
  const initialReleaseRateError: string | undefined = useMemo(() => {
    const value = parseFloat(initialReleaseRate)
    if (isNaN(value)) {
      return 'invalid value'
    }
    if (!vestingEnabled && !cliffEnabled) {
      if (value !== 100) {
        return 'release rate must be 100'
      }
    } else {
      if (value < 10 || value > 100) {
        return 'value must be between 10 and 100'
      }
      const cliffRelease = parseFloat(cliffReleaseRate)
      if (cliffRelease + value > 100) {
        return 'Sum of this and cliff release percentage is more than 100%'
      }
    }
    return
  }, [initialReleaseRate, vestingEnabled, cliffEnabled, cliffReleaseRate])
  const releaseDurationError: string | undefined = useMemo(() => {
    const value = parseFloat(releaseDuration)
    const interval = parseFloat(releaseIntervalDays)
    if (isNaN(value)) {
      return 'invalid value'
    }
    if (!vestingEnabled) {
      if (value !== 0) {
        return 'value must be 0'
      }
    } else {
      if (value < 2) {
        return 'value mustbe bigger than 1'
      }
      if (value * interval > 365) {
        return 'vesting can not be more than 1 year'
      }
    }
    return
  }, [releaseDuration, releaseIntervalDays, vestingEnabled])
  const cliffDurationDaysError: string | undefined = useMemo(() => {
    const value = parseFloat(cliffDurationDays)
    if (isNaN(value)) {
      return 'invalid value'
    }
    if (!cliffEnabled) {
      if (value !== 0) {
        return 'value must be 0'
      }
    } else {
      if (value <= 0) {
        return 'enter a value'
      }
      if (value > 180) {
        return 'cliff can not be more than 180 days'
      }
    }
    return
  }, [cliffDurationDays, cliffEnabled])
  const cliffReleaseRateError: string | undefined = useMemo(() => {
    const value = parseFloat(cliffReleaseRate)
    if (isNaN(value)) {
      return 'invalid value'
    }
    if (!cliffEnabled) {
      if (value !== 0) {
        return 'value must be 0'
      }
    } else {
      if (value < 0 || value > 100) {
        return 'value must be between 0 and 100'
      }
    }
    return
  }, [cliffReleaseRate, cliffEnabled])

  const isFormValid = useMemo(() => {
    return !initialReleaseRateError && !releaseDurationError && !cliffDurationDaysError && !cliffReleaseRateError
  }, [initialReleaseRateError, releaseDurationError, cliffDurationDaysError, cliffReleaseRateError])

  const onClick = () => {
    if (isFormValid) {
      const duration = parseFloat(releaseDuration)
      const interval = parseFloat(releaseIntervalDays)
      onSubmit({
        releaseIntervalDays,
        releaseDurationDays: (duration * interval).toString(),
        initialReleaseRate,
        cliffDurationDays: cliffEnabled ? cliffDurationDays : '0',
        cliffReleaseRate: cliffEnabled ? cliffReleaseRate : '0',
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onClose} maxWidth={520}>
      <ModalWrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans>Add Tokenomics Info</Trans>
          </ThemedText.SubHeader>
          <CloseIcon onClick={onClose} />
        </HeaderRow>
        <Row marginBottom="12px">
          {vestingEnabled || cliffEnabled ? (
            <NumericalInputPanel
              label="Unlocked at TGE"
              placeholder="Unlocked percentage at lauch end date"
              value={initialReleaseRate}
              onChange={setInitialReleaseRate}
              isError={!!initialReleaseRateError}
              errorMessage={initialReleaseRateError}
            />
          ) : (
            <div>Unlocked at TGE : {initialReleaseRate}%</div>
          )}
        </Row>
        <RowBetween>
          <ThemedText.BodyPrimary>
            <Trans>Token Vesting</Trans>
          </ThemedText.BodyPrimary>
          <Toggle isActive={vestingEnabled} toggle={() => setVestingEnabled((val) => !val)} />
        </RowBetween>
        {vestingEnabled && (
          <Row gap="10px">
            <Column flex="1">
              <ActionSelector
                title="Vesting Schedule"
                items={releaseIntervals}
                selectedAction={releaseIntervalDays}
                onActionSelect={(val) => setReleaseIntervalDays(val)}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Vestin duration"
                placeholder=""
                value={releaseDuration}
                onChange={(val) => setReleaseDuration(val)}
                isError={!!releaseDurationError}
                errorMessage={releaseDurationError}
              />
            </Column>
          </Row>
        )}

        <RowBetween>
          <ThemedText.BodyPrimary>
            <Trans>Vesting Cliff</Trans>
          </ThemedText.BodyPrimary>
          <Toggle isActive={cliffEnabled} toggle={() => setCliffEnabled((val) => !val)} />
        </RowBetween>
        {cliffEnabled && (
          <Row gap="10px">
            <Column flex="1">
              <NumericalInputPanel
                label="Cliff duration"
                placeholder=""
                value={cliffDurationDays}
                onChange={(val) => setCliffDurationDays(val)}
                isError={!!cliffDurationDaysError}
                errorMessage={cliffDurationDaysError}
              />
            </Column>
            <Column flex="1">
              <NumericalInputPanel
                label="Cliff Release Rate"
                placeholder="Unlocked percentage at cliff end time"
                value={cliffReleaseRate}
                onChange={(val) => setCliffReleaseRate(val)}
                isError={!!cliffReleaseRateError}
                errorMessage={cliffReleaseRateError}
              />
            </Column>
          </Row>
        )}

        <DarkGrayCard>
          {!vestingEnabled && !cliffEnabled ? (
            <ThemedText.BodyPrimary>- All tokens will be released when launchpad ends</ThemedText.BodyPrimary>
          ) : (
            <>
              {initialReleaseRate !== '0' && (
                <ThemedText.BodyPrimary>
                  - {initialReleaseRate}% of tokens will be released when launchpad ends
                </ThemedText.BodyPrimary>
              )}
              {cliffEnabled && (
                <ThemedText.BodyPrimary>
                  - There will be a cliff perid for {cliffDurationDays} days
                </ThemedText.BodyPrimary>
              )}
              {cliffReleaseRate !== '0' && (
                <ThemedText.BodyPrimary>
                  - {cliffReleaseRate}% of tokens will be released at the end of cliff period
                </ThemedText.BodyPrimary>
              )}
              {vestingEnabled && (
                <ThemedText.BodyPrimary>
                  - Remaining {100 - parseFloat(initialReleaseRate) - parseFloat(cliffReleaseRate)}% of tokens will be
                  released {releaseIntervals.find((r) => r.id === releaseIntervalDays)?.name.toLowerCase() || ''} for{' '}
                  {releaseDuration}{' '}
                  {releaseIntervalDays == '7' ? 'weeks' : releaseIntervalDays == '30' ? 'months' : 'days'}
                </ThemedText.BodyPrimary>
              )}
            </>
          )}
        </DarkGrayCard>

        <ButtonPrimary onClick={onClick} disabled={!isFormValid}>
          OK
        </ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
