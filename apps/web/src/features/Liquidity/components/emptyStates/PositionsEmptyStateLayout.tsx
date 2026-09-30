import { Flex, Text } from '@universe/mycelium'
import { Pools } from '@universe/mycelium/icons/Pools'
import type { TestIDType } from '@universe/test'

export const BUTTON_AREA_WIDTH = 160 * 2

interface PositionsEmptyStateLayoutProps {
  title: string
  description: string
  action: JSX.Element
  withBorder?: boolean
  testID?: TestIDType
}

export function PositionsEmptyStateLayout({
  title,
  description,
  action,
  withBorder = false,
  testID,
}: PositionsEmptyStateLayoutProps): JSX.Element {
  return (
    <Flex
      width="100%"
      testID={testID}
      {...(!withBorder && {
        centered: true,
        alignSelf: 'center',
        maxWidth: 420,
        py: '$spacing40',
      })}
    >
      <Flex
        centered
        gap="$spacing24"
        width="100%"
        {...(withBorder && {
          padding: '$spacing24',
          borderRadius: '$rounded12',
          borderColor: '$surface3',
          borderWidth: '$spacing1',
          borderStyle: 'solid',
        })}
        $platform-web={{
          textAlign: 'center',
        }}
      >
        <Flex centered gap="$gap16" width="100%">
          <Pools size="$icon.64" color="$neutral2" />
          <Flex centered gap="$gap8" width="100%">
            <Text variant="heading3">{title}</Text>
            <Text variant="body2" color="$neutral2" maxWidth={420}>
              {description}
            </Text>
          </Flex>
        </Flex>
        {action}
      </Flex>
    </Flex>
  )
}
