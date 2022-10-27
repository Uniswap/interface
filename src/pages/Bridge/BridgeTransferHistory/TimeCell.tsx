import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

import { ONLY_DATE_FORMAT, ONLY_TIME_FORMAT } from '../consts'

type Props = {
  timestamp?: number | ''
}

const TimeCell: React.FC<Props> = ({ timestamp }) => {
  const dateString = timestamp ? dayjs.utc(timestamp).local().format(ONLY_DATE_FORMAT) : ''
  const timeString = timestamp ? dayjs.utc(timestamp).local().format(ONLY_TIME_FORMAT) : ''

  const theme = useTheme()
  return (
    <Flex
      sx={{
        fontWeight: 500,
        fontSize: '12px',
        lineHeight: '16px',
        color: theme.subText,
        justifyContent: 'space-between',
      }}
    >
      {timeString ? (
        <>
          <Text as="span">
            <Text
              as="span"
              sx={{
                display: 'inline-block',
                width: '70px',
                marginRight: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {dateString}
            </Text>
          </Text>

          <Text as="span">{timeString}</Text>
        </>
      ) : (
        <Text as="span">
          <Trans>Unknown</Trans>
        </Text>
      )}
    </Flex>
  )
}

export default TimeCell
