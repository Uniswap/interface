import { Flex } from 'ui/src'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'

export function AssetPercentChangeCell({
  delta,
  formattedDelta,
  loading,
}: {
  delta?: number
  formattedDelta: string
  loading: boolean
}): JSX.Element {
  return (
    <Cell loading={loading} justifyContent="flex-end">
      <Flex row gap="$gap4" alignItems="center">
        <DeltaArrow delta={delta} formattedDelta={formattedDelta} />
        <TableText>{formattedDelta}</TableText>
      </Flex>
    </Cell>
  )
}
