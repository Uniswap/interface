import { Flex } from 'ui/src'
import type { ReportModalContentProps } from 'uniswap/src/components/reporting/ReportModalContent'

export function ReportModalContent({ children, keyboardHeight }: ReportModalContentProps): JSX.Element {
  return <Flex pb={keyboardHeight}>{children}</Flex>
}
