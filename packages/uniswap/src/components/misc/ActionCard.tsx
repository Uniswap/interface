import { Flex, FlexProps, Text, TouchableArea, useShadowPropsShort } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export interface ActionCardItem {
  title: string
  blurb: string
  icon: JSX.Element
  elementName: ElementName
  badgeText?: string
  containerProps?: FlexProps
  hoverStyle?: FlexProps
  leftAlign?: boolean
  borderRadius?: FlexProps['borderRadius']
  onPress?: () => void
  backgroundImageWrapperCallback?: React.FC<{ children: React.ReactNode }>
  shadowProps?: ReturnType<typeof useShadowPropsShort>
}

export const ActionCard = ({
  title,
  blurb,
  onPress,
  icon,
  elementName,
  containerProps,
  hoverStyle,
  leftAlign = false,
  backgroundImageWrapperCallback,
  borderRadius,
  shadowProps,
}: ActionCardItem): JSX.Element => (
  <Trace logPress element={elementName}>
    <TouchableArea
      backgroundColor={backgroundImageWrapperCallback ? undefined : '$surface1'}
      borderColor="$surface3"
      borderRadius={borderRadius ?? '$rounded24'}
      borderWidth="$spacing1"
      overflow="hidden"
      hoverStyle={hoverStyle}
      onPress={onPress}
      {...shadowProps}
    >
      <BackgroundWrapper BackgroundImageWrapper={backgroundImageWrapperCallback}>
        <Flex
          shrink
          centered={!leftAlign}
          alignContent="center"
          gap="$spacing4"
          px="$spacing20"
          py="$spacing12"
          {...containerProps}
        >
          {icon}
          <Flex shrink centered={!leftAlign} alignContent={leftAlign ? 'flex-start' : 'center'} gap="$spacing4">
            <Text textAlign={leftAlign ? 'left' : 'center'} variant="buttonLabel2">
              {title}
            </Text>
            <Text color="$neutral2" textAlign={leftAlign ? 'left' : 'center'} variant="body3">
              {blurb}
            </Text>
          </Flex>
        </Flex>
      </BackgroundWrapper>
    </TouchableArea>
  </Trace>
)

const BackgroundWrapper = ({
  children,
  BackgroundImageWrapper,
}: {
  children: React.ReactNode
  BackgroundImageWrapper?: React.FC<{ children: React.ReactNode }>
}): JSX.Element => {
  return BackgroundImageWrapper !== undefined ? (
    <BackgroundImageWrapper>{children}</BackgroundImageWrapper>
  ) : (
    <Flex>{children}</Flex>
  )
}
