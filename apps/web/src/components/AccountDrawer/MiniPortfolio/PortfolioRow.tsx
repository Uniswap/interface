import { LoadingBubble } from 'components/Tokens/loading'
import { Flex, FlexProps } from 'ui/src'

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

function PortfolioSkeletonRow({ shrinkRight }: { shrinkRight?: boolean }) {
  return (
    <PortfolioRowWrapper>
      <LoadingBubble height="40px" width="40px" round />
      <Flex alignItems="center" flexGrow={1} gap="$gap4">
        <LoadingBubble height="16px" width="60px" delay="300ms" />
        <LoadingBubble height="10px" width="90px" delay="300ms" />
      </Flex>
      <Flex alignItems="flex-end" gap="$gap4">
        {shrinkRight ? (
          <LoadingBubble height="12px" width="20px" delay="600ms" />
        ) : (
          <>
            <LoadingBubble height="14px" width="70px" delay="600ms" />
            <LoadingBubble height="14px" width="50px" delay="600ms" />
          </>
        )}
      </Flex>
    </PortfolioRowWrapper>
  )
}

export function PortfolioSkeleton({ shrinkRight = false }: { shrinkRight?: boolean }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <PortfolioSkeletonRow shrinkRight={shrinkRight} key={`portfolio loading row${i}`} />
      ))}
    </>
  )
}
