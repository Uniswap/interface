import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

const TimeWrapper = styled.div<{ $background: string }>`
  width: fit-content;
  height: fit-content;
  padding: 16px;

  position: absolute;
  top: 16px;
  right: 16px;

  display: flex;
  flex-direction: column;
  gap: 8px;

  border-radius: 16px;

  background: ${({ $background }) => $background};
  background-size: cover;
  background-repeat: no-repeat;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    position: unset;
    width: 100%;
    height: 36px;
    padding: 0 24px;

    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    background:  unset;
    box-shadow: unset;
  `}
`

const CustomText = styled(Text)<{ underlined?: boolean }>`
  position: relative;
  cursor: pointer;

  ${({ underlined }) =>
    underlined
      ? css`
          ::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100% - 2px);
            height: 0;
            border-bottom: ${({ theme }) => `1px dashed ${theme.subText}`};
          }
        `
      : ''}
`

type TimeProps = {
  title: string
  timeStr: string
  background: string
  tooltip?: string
}

const Time: React.FC<TimeProps> = ({ title, timeStr, background, tooltip }) => {
  const theme = useTheme()

  return (
    <TimeWrapper $background={background}>
      <Text
        sx={{
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          color: theme.subText,
        }}
      >
        {title}
      </Text>

      <MouseoverTooltip text={tooltip} placement="top" width="fit-content" disableTooltip={!tooltip}>
        <CustomText
          underlined={!!tooltip}
          sx={{
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '24px',
            color: theme.text,
          }}
        >
          {timeStr}
        </CustomText>
      </MouseoverTooltip>
    </TimeWrapper>
  )
}

type Props = {
  startTime: number
  endTime: number
}

const CountdownTimer: React.FC<Props> = ({ startTime, endTime }) => {
  const theme = useTheme()
  const now = Math.floor(Date.now() / 1000)

  if (now < startTime) {
    return (
      <Time
        background={rgba(theme.warning, 0.6)}
        title={t`Starting in`}
        timeStr={getFormattedTimeFromSecond(startTime - now)}
        tooltip={dayjs(startTime * 1000).format('YYYY-MM-DD HH:mm')}
      />
    )
  }

  if (now < endTime) {
    return (
      <Time
        background={rgba(theme.primary, 0.6)}
        title={t`Ending in`}
        timeStr={getFormattedTimeFromSecond(endTime - now)}
        tooltip={dayjs(endTime * 1000).format('YYYY-MM-DD HH:mm')}
      />
    )
  }

  return (
    <Time
      background={rgba(theme.red, 0.6)}
      title={t`Ended at`}
      timeStr={dayjs(endTime * 1000).format('YYYY-MM-DD HH:mm')}
    />
  )
}

export default CountdownTimer
