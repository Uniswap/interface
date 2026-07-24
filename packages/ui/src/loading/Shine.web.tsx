import { Flex } from 'ui/src/components/layout'
import { ShineProps } from 'ui/src/loading/ShineProps'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

const CSS_RULE_ID = '__shine_keyframes__'
const KEYFRAMES_CSS = `
@keyframes shine {
  from {
    -webkit-mask-position: 150%;
  }
  to {
    -webkit-mask-position: -50%;
  }
}
`

export function Shine({ shimmerDurationSeconds = 1, children, disabled, ...rest }: ShineProps): JSX.Element {
  useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS, active: !disabled })

  return (
    <Flex
      {...rest}
      style={
        disabled
          ? undefined
          : {
              WebkitMaskImage: `linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)`,
              WebkitMaskSize: '200%',
              animationName: 'shine',
              animationDuration: `${shimmerDurationSeconds}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: rest['$platform-web']?.animationDelay,
            }
      }
    >
      {children}
    </Flex>
  )
}
