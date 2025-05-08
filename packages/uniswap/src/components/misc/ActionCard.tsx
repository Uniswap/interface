import { Flex, FlexProps, Text, TouchableArea } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'

export interface ActionCardItem {
  title: string
  blurb: string
  icon: JSX.Element
  elementName: ElementNameType
  badgeText?: string
  containerProps?: FlexProps
  hoverStyle?: FlexProps
  leftAlign?: boolean
  onPress?: () => void
  BackgroundImageWrapperCallback?: React.FC<{ children: React.ReactNode }>
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
  BackgroundImageWrapperCallback,
}: ActionCardItem): JSX.Element => (
  <Trace logPress element={elementName}>
    <TouchableArea
      backgroundColor={BackgroundImageWrapperCallback ? undefined : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      overflow="hidden"
      hoverStyle={hoverStyle}
      onPress={onPress}
    >
      <BackgroundWrapper BackgroundImageWrapper={BackgroundImageWrapperCallback}>
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
          <Flex shrink centered={!leftAlign} alignContent={leftAlign ? 'flex-start' : 'center'}>
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
