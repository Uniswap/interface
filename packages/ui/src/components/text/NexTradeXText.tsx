import { GetProps } from 'tamagui'
import { Text } from 'ui/src/components/text'

const gradientStyle = `
  .nextradex-gradient {
    color: #4673fa;

    @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
      background-image: linear-gradient(0deg, #4673fa -101.76%, #9646fa 101.76%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
`

// TODO(WEB-4313): Wrap GradientText once it works for web.
export function NexTradeXText({ children, ...props }: GetProps<typeof Text>): JSX.Element {
  return (
    <>
      <style>{gradientStyle}</style>
      {/* Do not use gradient color if a color prop override is defined */}
      <Text {...props} className={!props.color ? 'nextradex-gradient' : ''}>
        {children}
      </Text>
    </>
  )
}
