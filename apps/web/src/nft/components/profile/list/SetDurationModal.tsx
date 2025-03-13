import { useOnClickOutside } from 'hooks/useOnClickOutside'
import styled from 'lib/styled-components'
import ms from 'ms'
import { NumericInput } from 'nft/components/layout/Input'
import { Dropdown } from 'nft/components/profile/list/Dropdown'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption } from 'nft/types'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Z_INDEX } from 'theme/zIndex'
import { Flex, Text } from 'ui/src'

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
  valid = 0,
  empty = 1,
  overMax = 2,
}

export const SetDurationModal = () => {
  const { t } = useTranslation()
  const [duration, setDuration] = useState(Duration.day)
  const [amount, setAmount] = useState('7')
  const [errorState, setErrorState] = useState(ErrorState.valid)
  const setGlobalExpiration = useSellAsset((state) => state.setGlobalExpiration)
  const [showDropdown, toggleShowDropdown] = useReducer((s) => !s, false)
  const durationDropdownRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(durationDropdownRef, showDropdown ? toggleShowDropdown : undefined)

  const setCustomExpiration = (text: string) => {
    setAmount(text.length ? text : '')
  }

  const durationOptions: DropDownOption[] = useMemo(
    () => [
      {
        displayText: t('common.time.hours'),
        isSelected: duration === Duration.hour,
        onClick: () => {
          setDuration(Duration.hour)
          toggleShowDropdown()
        },
      },
      {
        displayText: t('common.time.days'),
        isSelected: duration === Duration.day,
        onClick: () => {
          setDuration(Duration.day)
          toggleShowDropdown()
        },
      },
      {
        displayText: t('common.time.weeks'),
        isSelected: duration === Duration.week,
        onClick: () => {
          setDuration(Duration.week)
          toggleShowDropdown()
        },
      },
      {
        displayText: t('common.time.months'),
        isSelected: duration === Duration.month,
        onClick: () => {
          setDuration(Duration.month)
          toggleShowDropdown()
        },
      },
    ],
    [duration, t],
  )

  let prompt
  switch (duration) {
    case Duration.hour:
      prompt = t('common.time.hours', { count: +amount })
      break
    case Duration.day:
      prompt = t('common.time.days', { count: +amount })
      break
    case Duration.week:
      prompt = t('common.time.weeks', { count: +amount })
      break
    case Duration.month:
      prompt = t('common.time.months', { count: +amount })
      break
    default:
      break
  }

  useEffect(() => {
    const expiration = convertDurationToExpiration(parseFloat(amount), duration)

    if (expiration * 1000 - Date.now() < ms(`60s`) || isNaN(expiration)) {
      setErrorState(ErrorState.empty)
    } else if (expiration * 1000 - Date.now() > ms(`180d`)) {
      setErrorState(ErrorState.overMax)
    } else {
      setErrorState(ErrorState.valid)
    }
    setGlobalExpiration(expiration)
  }, [amount, duration, setGlobalExpiration])

  return (
    <Flex gap="$spacing4" ref={durationDropdownRef}>
      <Flex
        row
        py={6}
        pr={6}
        pl={12}
        borderWidth={1}
        borderColor={errorState !== ErrorState.valid ? '$statusCritical' : '$surface3'}
        height={44}
        width={160}
        borderRadius="$rounded8"
        justifyContent="space-between"
      >
        <NumericInput
          color="$neutral1"
          value={amount}
          width={40}
          mr="$spacing4"
          backgroundColor="none"
          onChangeText={setCustomExpiration}
          flexShrink={0}
        />
        <Flex
          row
          onPress={toggleShowDropdown}
          gap="$gap4"
          backgroundColor="$surface3"
          cursor="pointer"
          borderRadius="$rounded8"
          py="$spacing6"
          pr="$spacing4"
          pl="$spacing8"
          $platform-web={{
            whiteSpace: 'nowrap',
          }}
          hoverStyle={{
            opacity: 0.5,
          }}
        >
          <Text variant="body3" color="$neutral1">
            {prompt}{' '}
          </Text>
          <DropdownChevron isOpen={showDropdown} />
        </Flex>
        {showDropdown && (
          <DropdownContainer>
            <Dropdown dropDownOptions={durationOptions} width={125} />
          </DropdownContainer>
        )}
      </Flex>
      {errorState !== ErrorState.valid && (
        <Flex row gap="$gap4" position="absolute" top={44} $platform-web={{ whiteSpace: 'nowrap' }}>
          <WarningIcon />
          <Text variant="body4" color="$statusCritical">
            {errorState === ErrorState.overMax ? 'Maximum 6 months' : 'Set duration'}
          </Text>
        </Flex>
      )}
    </Flex>
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
