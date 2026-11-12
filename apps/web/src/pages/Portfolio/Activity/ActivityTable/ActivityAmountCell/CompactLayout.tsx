import { Flex, Text } from '@universe/mycelium'
import { Receipt } from '@universe/mycelium/icons/Receipt'
import { COMPACT_THUMBNAIL_SIZE } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/utils'

interface CompactLayoutProps {
  typeLabel: string
  logo: React.ReactNode
  amountText: string | null
}

export function CompactLayout({ typeLabel, logo, amountText }: CompactLayoutProps): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$gap12">
      {logo ?? (
        <Flex
          width={COMPACT_THUMBNAIL_SIZE}
          height={COMPACT_THUMBNAIL_SIZE}
          borderRadius="$roundedFull"
          backgroundColor="$surface3"
          alignItems="center"
          justifyContent="center"
        >
          <Receipt size="$icon.16" color="$neutral2" />
        </Flex>
      )}
      <Flex>
        <Text variant="body4" color="$neutral2">
          {typeLabel}
        </Text>
        {amountText && (
          <Text variant="body3" color="$neutral1">
            {amountText}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
