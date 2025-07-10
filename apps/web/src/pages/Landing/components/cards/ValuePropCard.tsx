import { useNavigate } from 'react-router-dom'
import { Flex, FlexProps, Text } from 'ui/src'

type ValuePropCardProps = FlexProps & {
  smaller?: boolean
  children?: React.ReactNode
  button?: React.ReactNode
  titleText?: string
  alignTextToBottom?: boolean
  href?: string
  to?: string
  color?: string
}

export default function ValuePropCard(props: ValuePropCardProps) {
  const { color, alignTextToBottom, href, to, button, children, titleText, smaller, ...rest } = props
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
    }
  }

  return (
    <Flex
      position="relative"
      flexShrink={1}
      flexGrow={0}
      flexBasis="auto"
      borderRadius={32}
      width="100%"
      height={609}
      overflow="hidden"
      minHeight={240}
      maxWidth="calc(50% - 8px)"
      containerType="normal"
      group="card"
      tag="a"
      href={href}
      target="_blank"
      cursor="pointer"
      rel="noreferrer noopener"
      onPress={handleClick}
      $platform-web={{
        textDecoration: 'none',
      }}
      $lg={{
        maxWidth: '100%',
        height: 'auto',
      }}
      $xl={{
        height: 516,
        ...(smaller && {
          height: 'auto',
          pr: 0,
        }),
      }}
      {...(smaller && {
        height: 340,
        pr: '16%',

        $sm: {
          height: 'auto',
        },
      })}
      {...rest}
    >
      <Flex
        width="100%"
        height="100%"
        gap={16}
        p={32}
        alignItems="flex-start"
        zIndex={2}
        pointerEvents="none"
        justifyContent={alignTextToBottom ? 'space-between' : 'flex-start'}
        $xs={{
          p: 20,
        }}
      >
        {button}
        <Text
          className="text-wrap-pretty"
          fontSize={36}
          lineHeight={44}
          whiteSpace="pre-line"
          color={color}
          $platform-web={{
            fontFeatureSettings: `'ss07' on`,
            textDecoration: 'none',
          }}
          $xl={{
            fontSize: 28,
            lineHeight: 32,
          }}
          $md={{
            fontSize: 24,
            lineHeight: 32,
          }}
        >
          {titleText}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
}
