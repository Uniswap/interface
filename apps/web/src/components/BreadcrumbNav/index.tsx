import { Currency } from '@uniswap/sdk-core'
import {
  cn,
  Flex,
  type FlexCompatProps,
  Text,
  Text as TextCompat,
  type TextCompatProps,
  type TextProps,
  useMedia,
} from '@universe/mycelium'
import { flexCompatClassName } from '@universe/mycelium/flex-compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { TestID } from '@universe/test'
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { iconSizes } from 'ui/src/theme'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { shortenAddress } from 'utilities/src/addresses'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const BreadcrumbNavContainer: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FlexCompatProps>(function BreadcrumbNavContainer(props, ref) {
    return <Flex ref={ref} row alignItems="center" gap="$gap4" mb={20} width="fit-content" {...props} />
  })

export const BreadcrumbNavLink = ({ to, children, ...rest }: { to: string; children: React.ReactNode } & TextProps) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Text
        display="flex"
        alignItems="center"
        transition={`color ${SPORE_ANIMATION_CURVE_CSS.fast}`}
        color="$neutral2"
        $platform-web={{
          textDecoration: 'none',
        }}
        hoverStyle={{ color: '$neutral2Hovered' }}
        {...rest}
      >
        {children}
      </Text>
    </Link>
  )
}

const CURRENT_PAGE_BREADCRUMB_CLASSNAME = flexCompatClassName({ row: true, gap: 6 })

function CurrentPageBreadcrumbContainer({ className, ...props }: ComponentPropsWithoutRef<'div'>): JSX.Element {
  // oxlint-disable-next-line react/forbid-elements -- the compat Flex forwards a fixed aria allow-list (mycelium compat/aria-props.ts) with no `aria-current`, and this node's `aria-current="page"` must reach the DOM
  return <div className={cn(CURRENT_PAGE_BREADCRUMB_CLASSNAME, className)} {...props} />
}

// This must be an h1 to match the SEO title, and must be the first heading tag in code.
const PageTitleText = forwardRef<HTMLElement, TextCompatProps>(function PageTitleText(props, ref) {
  return (
    <TextCompat
      ref={ref}
      tag="h1"
      fontWeight="inherit"
      fontSize="inherit"
      lineHeight="inherit"
      color="$neutral1"
      whiteSpace="nowrap"
      margin={0}
      {...props}
    />
  )
})

// Used in both TDP & PDP.
// On TDP, currency is defined & poolName is undefined. On PDP, currency is undefined & poolName is defined.
export const CurrentPageBreadcrumb = ({
  address,
  currency,
  poolName,
}: {
  address?: string
  currency?: Currency
  poolName?: string
}) => {
  const { t } = useTranslation()
  const isNative = currency?.isNative
  const tokenSymbolName = currency?.symbol ?? t('tdp.symbolNotFound')

  const media = useMedia()
  const shouldEnableCopy = !media.md
  const [isBreadcrumbHover, setIsBreadcrumbHover] = useState(false)

  return (
    <CurrentPageBreadcrumbContainer
      aria-current="page"
      data-testid={TestID.CurrentBreadcrumb}
      onMouseEnter={() => setIsBreadcrumbHover(true)}
      onMouseLeave={() => setIsBreadcrumbHover(false)}
    >
      <PageTitleText>{currency ? tokenSymbolName : poolName}</PageTitleText>
      {(!currency || !isNative) && address && (
        <CopyHelper
          toCopy={address}
          iconPosition="right"
          iconSize={iconSizes.icon16}
          iconColor="$neutral2"
          color="$neutral2"
          disabled={!shouldEnableCopy}
          externalHover={isBreadcrumbHover}
          dataTestId={TestID.BreadcrumbHoverCopy}
        >
          <Text color="$neutral2" $platform-web={{ whiteSpace: 'nowrap' }}>
            {shortenAddress({ address })}
          </Text>
        </CopyHelper>
      )}
    </CurrentPageBreadcrumbContainer>
  )
}
