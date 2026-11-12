import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { ReactNode } from 'react'

// The legacy `animation: 'fast'` transitioned every property; the only styles that change at
// runtime are the hover background and the disabled opacity, so the transition is scoped to those.
// background-color stays in deliberately: the legacy hover fill visibly animated (and therefore
// also transitioned on theme toggle) — matching prod wins over the color-flash rule here.
const TILE_TRANSITION = `background-color ${SPORE_ANIMATION_CURVE_CSS.fast}, opacity ${SPORE_ANIMATION_CURVE_CSS.fast}`

// A wrapper (not the styled() factory): callers override the token-typed `p` prop per site, which
// only the compat prop surface resolves; caller props spread last so they win, like legacy.
function Tile(props: FlexCompatProps): JSX.Element {
  return (
    <Flex
      gap="$gap12"
      userSelect="none"
      height="100%"
      flex={1}
      display="flex"
      justifyContent="flex-start"
      p="$padding12"
      backgroundColor="$accent2"
      overflow="hidden"
      borderColor="transparent"
      borderRadius="$rounded16"
      borderStyle="solid"
      borderWidth="1px"
      transition={TILE_TRANSITION}
      hoverStyle={{
        backgroundColor: '$accent2Hovered',
        cursor: 'pointer',
      }}
      disabledStyle={{
        cursor: 'default',
        opacity: 0.6,
      }}
      {...props}
    />
  )
}

export type ActionTileProps = {
  dataTestId: string
  Icon: ReactNode
  name: string
  onClick: () => void
  disabled?: boolean
  padding?: FlexCompatProps['p']
}

export function ActionTile({ dataTestId, Icon, name, onClick, disabled, padding = '$spacing12' }: ActionTileProps) {
  return (
    <Tile testID={dataTestId} onPress={onClick} disabled={disabled} p={padding}>
      {Icon}
      <Text variant="buttonLabel2" color="$accent1">
        {name}
      </Text>
    </Tile>
  )
}
