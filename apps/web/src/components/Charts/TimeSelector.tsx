import { DISPLAYS, ORDERED_TIMES } from 'components/Tokens/TokenTable/TimeSelector'
import { TimePeriod } from 'graphql/data/util'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { Flex, Text, styled } from 'ui/src'

export const refitChartContentAtom = atom<(() => void) | undefined>(undefined)
const DEFAULT_TIME_SELECTOR_OPTIONS = ORDERED_TIMES.map((time: TimePeriod) => ({ time, display: DISPLAYS[time] }))

const TimeOptionsContainer = styled(Flex, {
  justifyContent: 'flex-end',
  gap: '$gap4',
  borderRadius: '$rounded16',
  height: 24,
  px: '$spacing4',
  width: 'fit-content',
  overflow: 'visible',
  $md: {
    width: '100%',
    justifyContent: 'space-between',
    borderWidth: 0,
  },
})

const TimeButton = styled(Flex, {
  flexGrow: 1,
  flexShrink: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 24,
  width: 24,
  borderRadius: '$roundedFull',
  cursor: 'pointer',
  animation: 'fast',
  borderWidth: 0,
  variants: {
    active: {
      true: {
        backgroundColor: '$surface3',
        hoverStyle: {
          opacity: 1,
        },
      },
      false: {
        backgroundColor: 'transparent',
        hoverStyle: {
          opacity: 0.6,
        },
      },
    },
  } as const,
})

interface TimePeriodSelectorOption {
  time: TimePeriod // Value to be selected/stored, used as default display value
  display: string // Value to be displayed
}

export default function TimePeriodSelector({
  options = DEFAULT_TIME_SELECTOR_OPTIONS,
  timePeriod,
  onChangeTimePeriod,
  className,
}: {
  options?: TimePeriodSelectorOption[]
  timePeriod: TimePeriod
  onChangeTimePeriod: (t: TimePeriod) => void
  className?: string
}) {
  const refitChartContent = useAtomValue(refitChartContentAtom)

  return (
    <TimeOptionsContainer row className={className}>
      {options.map(({ time, display }) => (
        <TimeButton
          key={display}
          active={timePeriod === time}
          onPress={() => {
            if (timePeriod === time) {
              refitChartContent?.()
            } else {
              onChangeTimePeriod(time)
            }
          }}
        >
          <Text
            fontWeight="$medium"
            fontSize={14}
            lineHeight={14}
            color={timePeriod === time ? '$neutral1' : '$neutral2'}
          >
            {display}
          </Text>
        </TimeButton>
      ))}
    </TimeOptionsContainer>
  )
}
