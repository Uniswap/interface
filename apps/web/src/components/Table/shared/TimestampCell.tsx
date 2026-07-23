import { Anchor, styled } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { useSyncedNowMs } from '~/components/Table/utils/useSyncedNowMs'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const StyledExternalLink = styled(Anchor, {
  textDecorationLine: 'none',
  ...ClickableTamaguiStyle,
  color: '$neutral1',
  target: '_blank',
  rel: 'noopener noreferrer',
})

const StyledTimestampRow = styled(StyledExternalLink, {
  group: true,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
  width: '100%',
  whiteSpace: 'nowrap',
  hoverStyle: {
    opacity: 1,
  },
})

/**
 * Converts the given timestamp to an abbreviated format (s,m,h) for timestamps younger than 1 day
 * and a full discreet format for timestamps older than 1 day (e.g. DD/MM HH:MMam/pm).
 * Hovering on the timestamp will display the full discreet format. (e.g. DD/MM/YYYY HH:MMam/pm)
 * Clicking on the timestamp will open the given link in a new tab
 * @param timestamp: unix timestamp in SECONDS
 * @param link: link to open on click
 * @returns JSX.Element containing the formatted timestamp
 */
export const TimestampCell = ({ timestamp, link }: { timestamp: number; link: string }) => {
  const locale = useCurrentLocale()
  const options: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  const fullDate = new Date(timestamp * 1000)
    .toLocaleString(locale, options)
    .toLocaleLowerCase(locale)
    .replace(/\s(am|pm)/, '$1')

  const abbreviatedTime = useAbbreviatedTimeString(timestamp * 1000)
  const now = useSyncedNowMs()
  const elapsedSeconds = Math.floor((now - timestamp * ONE_SECOND_MS) / ONE_SECOND_MS)

  return (
    <StyledTimestampRow href={link}>
      <MouseoverTooltip text={fullDate} placement="top" size={TooltipSize.Max}>
        <AnimatedNumber
          value={abbreviatedTime}
          numericValue={elapsedSeconds}
          textVariant="$body2"
          color="$neutral1"
          forceDirection={AnimatedNumberDirection.UP}
        />
      </MouseoverTooltip>
    </StyledTimestampRow>
  )
}
