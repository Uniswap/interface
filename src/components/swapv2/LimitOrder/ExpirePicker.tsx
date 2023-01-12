import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import DatePicker from 'components/DatePicker'
import Modal from 'components/Modal'
import Select from 'components/Select'
import useTheme from 'hooks/useTheme'

import { EXPIRED_OPTIONS, MIN_TIME_MINUTES } from './const'

const HOURS = Array.from({ length: 24 }, (_, i) => ({ label: i, value: i }))
const MINS = Array.from({ length: 60 }, (_, i) => ({ label: i, value: i }))

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 24px 20px;
  font-weight: 500;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
     padding: 16px 10px;
  `}
`

const DefaultOptionContainer = styled.div`
  background-color: ${({ theme }) => theme.background};
  padding: 10px;
  font-size: 12px;
  border-radius: 16px 0px 0px 16px;
  white-space: nowrap;
  display: flex;
  gap: 14px;
  padding-top: 20px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display:none;
  `}
`

const ResultContainer = styled.div`
  border: ${({ theme }) => `1px solid ${theme.warning}`};
  padding: 10px;
  border-radius: 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`

const isToday = (date: Date) => {
  const today = new Date()
  return (
    today.getDate() === date.getDate() &&
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth()
  )
}

export default function DateTimePicker({
  isOpen,
  onDismiss,
  onSetDate,
  expire,
  defaultDate,
}: {
  isOpen: boolean
  onDismiss: () => void
  onSetDate: (val: Date | number) => void
  expire: number
  defaultDate?: Date
}) {
  const today = new Date()
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [date, setDate] = useState(minDate)
  const [min, setMin] = useState(0)
  const [hour, setHour] = useState(0)
  const [defaultExpire, setDefaultExpire] = useState<number | null>(null)

  const setCustomDate = (date: Date, hour: number, min: number) => {
    let newMin = min
    let newHour = hour
    const now = new Date()

    if (isToday(date)) {
      if (hour < now.getHours()) {
        newHour = now.getHours()
      }
      if (newHour === now.getHours() && min < now.getMinutes() + MIN_TIME_MINUTES) {
        newMin = now.getMinutes() + MIN_TIME_MINUTES
      }
    }
    setHour(newHour)
    setMin(newMin)
    setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), newHour, newMin))
    setDefaultExpire(null)
  }

  const onSelectDefaultOption = useCallback((value: number) => {
    setDefaultExpire(value)
    const date = new Date(Date.now() + value * 1000)
    setDate(date)
    setHour(date.getHours())
    setMin(date.getMinutes())
  }, [])

  useEffect(() => {
    if (isOpen) {
      onSelectDefaultOption(expire)
      if (defaultDate) {
        setCustomDate(defaultDate, defaultDate.getHours(), defaultDate.getMinutes())
      }
    }
  }, [isOpen, onSelectDefaultOption, expire, defaultDate])

  const onSetMin = (min: number) => {
    setCustomDate(date, hour, min)
  }

  const onSetHour = (hour: number) => {
    setCustomDate(date, hour, min)
  }
  const theme = useTheme()

  const propsSelect = {
    style: { width: 120, borderRadius: 20, background: theme.background } as CSSProperties,
    menuStyle: {
      height: 250,
      overflow: 'scroll',
      top: 'unset',
      right: 'unset',
      textAlign: 'center',
      width: 'fit-content',
    } as CSSProperties,
  }

  const expireResult = defaultExpire ? Date.now() + defaultExpire * 1000 : date

  const hourOptions = useMemo(() => {
    const now = new Date()
    if (isToday(date)) return HOURS.filter(e => +e.value >= now.getHours())
    return HOURS
  }, [date])

  const minOptions = useMemo(() => {
    const now = new Date()
    if (isToday(date) && hour === now.getHours())
      return MINS.filter(e => +e.value >= now.getMinutes() + MIN_TIME_MINUTES)
    return MINS
  }, [date, hour])

  return (
    <Modal maxWidth={'98vw'} width={'480px'} isOpen={isOpen} enableSwipeGesture={false}>
      <Container>
        <Flex justifyContent={'space-between'} alignItems="center">
          <Text fontSize={14}>
            <Trans>Customize the Expiry Time</Trans>
          </Text>
          <X color={theme.text} onClick={onDismiss} cursor="pointer" />
        </Flex>
        <Flex style={{ gap: 16 }}>
          <DefaultOptionContainer>
            <Text color={theme.border}>
              <Trans>Default Options</Trans>
            </Text>
            {EXPIRED_OPTIONS.map(opt => (
              <Text
                style={{ cursor: 'pointer' }}
                color={opt.value === defaultExpire ? theme.primary : theme.subText}
                key={opt.value}
                onClick={() => opt.value && onSelectDefaultOption(Number(opt.value))}
              >
                {opt.label}
              </Text>
            ))}
          </DefaultOptionContainer>
          <Flex flexDirection="column" style={{ gap: 5, alignItems: 'center', flex: 1 }}>
            <DatePicker value={date} onChange={(date: Date) => setCustomDate(date, hour, min)} />

            <Flex justifyContent={'space-between'} width="100%" padding="0px 8px">
              <Select
                value={hour}
                activeRender={item => (
                  <Flex justifyContent={'space-between'} alignItems="center">
                    <Text color={theme.text} fontSize={14}>
                      {item?.label}
                    </Text>
                    <Text>
                      <Trans>Hour</Trans>
                    </Text>
                  </Flex>
                )}
                {...propsSelect}
                options={hourOptions}
                onChange={onSetHour}
              />
              <Select
                value={min}
                activeRender={item => (
                  <Flex justifyContent={'space-between'} alignItems="center">
                    <Text color={theme.text} fontSize={14}>
                      {item?.label}
                    </Text>
                    <Text>
                      <Trans>Min</Trans>
                    </Text>
                  </Flex>
                )}
                {...propsSelect}
                options={minOptions}
                onChange={onSetMin}
              />
            </Flex>
          </Flex>
        </Flex>
        <ResultContainer>
          <Flex alignItems={'center'} color={theme.subText}>
            <Calendar color={theme.warning} size={17} />
            <Text marginLeft={'5px'}>
              <Trans>Order will Expire on</Trans>
            </Text>
          </Flex>
          <Text color={theme.text}>{dayjs(expireResult).format('DD/MM/YYYY HH:mm')}</Text>
        </ResultContainer>
        <Flex justifyContent={'flex-end'} style={{ gap: 16 }}>
          <ButtonOutlined
            onClick={onDismiss}
            style={{
              width: 100,
              height: 32,
            }}
          >
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            onClick={() => {
              onSetDate(date)
              onDismiss()
            }}
            style={{
              width: 100,
              height: 32,
            }}
          >
            <Trans>Set</Trans>
          </ButtonPrimary>
        </Flex>
      </Container>
    </Modal>
  )
}
