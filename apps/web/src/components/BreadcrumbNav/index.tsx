import { Currency } from '@uniswap/sdk-core'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { CopyHelper } from 'theme/components/CopyHelper'
import { Flex, styled, Text, TextProps, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

export const BreadcrumbNavContainer = styled(Flex, {
  row: true,
  alignItems: 'center',
  gap: '$gap4',
  mb: 20,
  width: 'fit-content',
})

export const BreadcrumbNavLink = ({ to, children, ...rest }: { to: string; children: React.ReactNode } & TextProps) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Text
        display="flex"
        alignItems="center"
        animation="fast"
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

const CurrentPageBreadcrumbContainer = styled(Flex, {
  row: true,
  gap: 6,
})

// This must be an h1 to match the SEO title, and must be the first heading tag in code.
const PageTitleText = styled(Text, {
  tag: 'h1',
  fontWeight: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  color: '$neutral1',
  whiteSpace: 'nowrap',
  margin: 0,
})

// Used in both TDP & PDP.
// On TDP, currency is defined & poolName is undefined. On PDP, currency is undefined & poolName is defined.
export const CurrentPageBreadcrumb = ({
  address,
  currency,
  poolName,
}: {
  address: string
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
      data-testid="current-breadcrumb"
      onMouseEnter={() => setIsBreadcrumbHover(true)}
      onMouseLeave={() => setIsBreadcrumbHover(false)}
    >
      <PageTitleText>{currency ? tokenSymbolName : poolName}</PageTitleText>
      {(!currency || !isNative) && (
        <CopyHelper
          toCopy={address}
          iconPosition="right"
          iconSize={16}
          iconColor="$neutral2"
          color="$neutral2"
          disabled={!shouldEnableCopy}
          externalHover={isBreadcrumbHover}
          dataTestId={TestID.BreadcrumbHoverCopy}
        >
          {shortenAddress({ address })}
        </CopyHelper>
      )}
    </CurrentPageBreadcrumbContainer>
  )
}
