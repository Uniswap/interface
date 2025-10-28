import { TextLoader } from 'components/Liquidity/Loader'
import { Circle, Flex, FlexProps, Shine } from 'ui/src'

const PortfolioRowWrapper = ({ children, className, ...rest }: FlexProps) => (
  <Flex
    row
    gap="$gap12"
    height={68}
    flexGrow={1}
    px="$spacing16"
    animation="fast"
    cursor="pointer"
    alignItems="center"
    className={`portfolio-row-wrapper ${className}`}
    {...rest}
  >
    {children}
  </Flex>
)

export default function PortfolioRow({
  'data-testid': testId,
  left,
  title,
  descriptor,
  right,
  onClick,
  className,
  ...props
}: {
  'data-testid'?: string
  left: React.ReactNode
  title: React.ReactNode
  descriptor?: React.ReactNode
  right?: React.ReactNode
  setIsHover?: (b: boolean) => void
  onClick?: () => void
  className?: string
} & Omit<FlexProps, 'left' | 'right'>) {
  return (
    <PortfolioRowWrapper data-testid={testId} onPress={onClick} className={className} {...props}>
      {left}
      <Flex alignItems="flex-start" flex={1} overflow="hidden">
        {title}
        {descriptor}
      </Flex>
      {right && <Flex alignItems="flex-end">{right}</Flex>}
    </PortfolioRowWrapper>
  )
}

function PortfolioSkeletonRow() {
  return (
    <Shine>
      <Flex
        p="$spacing16"
        gap="$spacing20"
        borderWidth="$spacing1"
        borderRadius="$rounded20"
        borderColor="$surface3"
        width="100%"
        overflow="hidden"
      >
        <Flex row alignItems="center" justifyContent="space-between" gap="$gap12">
          <Circle size={36} backgroundColor="$surface3" />
          <Flex grow $md={{ row: true, justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <TextLoader variant="subheading1" width={100} />
            <TextLoader variant="body3" width={70} />
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="$gap12">
          <Flex gap="$gap2">
            <TextLoader variant="body2" width={40} />
            <TextLoader variant="body4" width={35} />
          </Flex>
          <Flex gap="$gap2">
            <TextLoader variant="body2" width={40} />
            <TextLoader variant="body4" width={35} />
          </Flex>
        </Flex>

        <TextLoader variant="body4" width={220} />
      </Flex>
    </Shine>
  )
}

export function PortfolioSkeleton() {
  return (
    <Flex gap="$gap12" px="$spacing16">
      {Array.from({ length: 5 }).map((_, i) => (
        <PortfolioSkeletonRow key={`portfolio loading row${i}`} />
      ))}
    </Flex>
  )
}
