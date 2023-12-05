import { Plural } from '@lingui/macro'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import ms from 'ms'
import { Column, Row } from 'nft/components/Flex'
import { NumericInput } from 'nft/components/layout/Input'
import { body, caption } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption } from 'nft/types'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { Z_INDEX } from 'theme/zIndex'

import { Dropdown } from './Dropdown'

const ModalWrapper = styled(Column)`
  gap: 4px;
  position: relative;
`

const InputWrapper = styled(Row)<{ isInvalid: boolean }>`
  padding: 6px 6px 6px 12px;
  border: 1px solid;
  position: relative;
  height: 44px;
  border-radius: 8px;
  border-color: ${({ isInvalid, theme }) => (isInvalid ? theme.critical : theme.surface3)};
  width: 160px;
  justify-content: space-between;
`

const DropdownPrompt = styled(Row)`
  gap: 4px;
  background-color: ${({ theme }) => theme.surface3};
  cursor: pointer;
  font-weight: 535;
  font-size: 14px;
  line-height: 16px;
  border-radius: 8px;
  padding: 6px 4px 6px 8px;
  white-space: nowrap;
  color: ${({ theme }) => theme.neutral1};

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
`

const DropdownChevron = styled(ChevronDown)<{ isOpen: boolean }>`
  height: 20px;
  width: 20px;
  color: ${({ theme }) => theme.neutral2};
  transform: ${({ isOpen }) => isOpen && 'rotate(180deg)'};
  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `transform ${duration.fast} ${timing.ease}`};
`

const DropdownContainer = styled.div`
  position: absolute;
  top: 48px;
  right: 0px;
  z-index: ${Z_INDEX.dropdown};
`

const ErrorMessage = styled(Row)`
  color: ${({ theme }) => theme.critical};
  gap: 4px;
  position: absolute;
  top: 44px;
  white-space: nowrap;
`

const WarningIcon = styled(AlertTriangle)`
  width: 16px;
  color: ${({ theme }) => theme.critical};
`

enum Duration {
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
}

enum ErrorState {
  valid,
  empty,
  overMax,
}

export const SetDurationModal = () => {
  const [duration, setDuration] = useState(Duration.day)
  const [amount, setAmount] = useState('7')
  const [errorState, setErrorState] = useState(ErrorState.valid)
  const setGlobalExpiration = useSellAsset((state) => state.setGlobalExpiration)
  const [showDropdown, toggleShowDropdown] = useReducer((s) => !s, false)
  const durationDropdownRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(durationDropdownRef, showDropdown ? toggleShowDropdown : undefined)

  const setCustomExpiration = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value.length ? event.target.value : '')
  }

  const durationOptions: DropDownOption[] = useMemo(
    () => [
      {
        displayText: 'hours',
        isSelected: duration === Duration.hour,
        onClick: () => {
          setDuration(Duration.hour)
          toggleShowDropdown()
        },
      },
      {
        displayText: 'days',
        isSelected: duration === Duration.day,
        onClick: () => {
          setDuration(Duration.day)
          toggleShowDropdown()
        },
      },
      {
        displayText: 'weeks',
        isSelected: duration === Duration.week,
        onClick: () => {
          setDuration(Duration.week)
          toggleShowDropdown()
        },
      },
      {
        displayText: 'months',
        isSelected: duration === Duration.month,
        onClick: () => {
          setDuration(Duration.month)
          toggleShowDropdown()
        },
      },
    ],
    [duration]
  )

  let prompt
  switch (duration) {
    case Duration.hour:
      prompt = <Plural value={amount} _1="hour" other="hours" />
      break
    case Duration.day:
      prompt = <Plural value={amount} _1="day" other="days" />
      break
    case Duration.week:
      prompt = <Plural value={amount} _1="week" other="weeks" />
      break
    case Duration.month:
      prompt = <Plural value={amount} _1="month" other="months" />
      break
    default:
      break
  }

  useEffect(() => {
    const expiration = convertDurationToExpiration(parseFloat(amount), duration)

    if (expiration * 1000 - Date.now() < ms(`60s`) || isNaN(expiration)) setErrorState(ErrorState.empty)
    else if (expiration * 1000 - Date.now() > ms(`180d`)) setErrorState(ErrorState.overMax)
    else setErrorState(ErrorState.valid)
    setGlobalExpiration(expiration)
  }, [amount, duration, setGlobalExpiration])

  return (
    <ModalWrapper ref={durationDropdownRef}>
      <InputWrapper isInvalid={errorState !== ErrorState.valid}>
        <NumericInput
          as="input"
          type="number"
          pattern="[0-9]"
          borderStyle="none"
          className={body}
          color={{ placeholder: 'neutral2', default: 'neutral1' }}
          value={amount}
          width="40"
          marginRight="4"
          backgroundColor="none"
          onChange={setCustomExpiration}
          flexShrink="0"
        />
        <DropdownPrompt onClick={toggleShowDropdown}>
          {prompt} <DropdownChevron isOpen={showDropdown} />
        </DropdownPrompt>
        {showDropdown && (
          <DropdownContainer>
            <Dropdown dropDownOptions={durationOptions} width={125} />
          </DropdownContainer>
        )}
      </InputWrapper>
      {errorState !== ErrorState.valid && (
        <ErrorMessage className={caption}>
          {' '}
          <WarningIcon /> {errorState === ErrorState.overMax ? 'Maximum 6 months' : 'Set duration'}
        </ErrorMessage>
      )}
    </ModalWrapper>
  )
}

const convertDurationToExpiration = (amount: number, duration: Duration) => {
  const durationFactor = () => {
    switch (duration) {
      case Duration.hour:
        return 1
      case Duration.day:
        return 24
      case Duration.week:
        return 24 * 7
      default: // month
        return 24 * 30
    }
  }
  return Math.round((Date.now() + ms(`1h`) * durationFactor() * amount) / 1000)
}
