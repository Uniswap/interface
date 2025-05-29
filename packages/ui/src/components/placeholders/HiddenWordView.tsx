import { Flex, FlexProps } from 'ui/src/components/layout/Flex'

type HiddenWordViewProps = {
  rows: number
  columns?: number
} & FlexProps

/**
 * UI component for displaying a placeholder for a view such as a seed phrase or private key
 */
export function HiddenWordView({ rows, columns = 1, ...flexProps }: HiddenWordViewProps): JSX.Element {
  return (
    <Flex
      row
      alignItems="stretch"
      backgroundColor="$surface2"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      gap="$spacing36"
      px="$spacing32"
      py="$spacing24"
      {...flexProps}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <HiddenWordViewColumn key={index} rows={rows} />
      ))}
    </Flex>
  )
}

function HiddenWordViewColumn({ rows }: { rows: number }): JSX.Element {
  return (
    <Flex grow gap="$spacing20">
      {new Array(rows).fill(0).map((_, idx) => (
        <Flex key={idx} backgroundColor="$surface3" borderRadius="$rounded20" height={10} />
      ))}
    </Flex>
  )
}
