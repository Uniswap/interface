import { Flex } from 'ui/src/components/layout'
import { ShineProps } from 'ui/src/loading/ShineProps'

export function Shine({ children, disabled }: ShineProps): JSX.Element {
  return (
    <Flex
      style={
        disabled
          ? undefined
          : {
              WebkitMaskImage: `linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)`,
              WebkitMaskSize: '200%',
              animation: 'shine 1s linear infinite',
            }
      }
    >
      {children}
    </Flex>
  )
}
