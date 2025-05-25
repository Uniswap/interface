import { Currency } from '@uniswap/sdk-core'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useCallback, useState } from 'react'
import { CheckCircle, Copy } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Flex, Text, TextProps, styled, useMedia, useSporeColors } from 'ui/src'
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

const TokenAddressHoverContainer = styled(Flex, {
  row: true,
  gap: 10,
  '$platform-web': {
    color: '$neutral2',
    whiteSpace: 'nowrap',
  },
  variants: {
    isDisabled: {
      true: {
        cursor: 'default',
      },
      false: {
        cursor: 'pointer',
      },
    },
  } as const,
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
  const { neutral2, statusSuccess } = useSporeColors()
  const [hover, setHover] = useState(false)

  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(address)
  }, [address, setCopied])

  const isNative = currency?.isNative
  const tokenSymbolName = currency?.symbol ?? t('tdp.symbolNotFound')

  const media = useMedia()
  const shouldEnableCopy = !media.md
  const shouldShowActions = shouldEnableCopy && hover

  return (
    <CurrentPageBreadcrumbContainer
      aria-current="page"
      data-testid="current-breadcrumb"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <PageTitleText>{currency ? tokenSymbolName : poolName}</PageTitleText>{' '}
      {(!currency || (currency && !isNative)) && (
        <TokenAddressHoverContainer
          data-testid="breadcrumb-token-address"
          isDisabled={!shouldEnableCopy}
          onPress={shouldEnableCopy ? copy : undefined}
        >
          <MouseoverTooltip
            placement="bottom"
            size={TooltipSize.Max}
            forceShow={isCopied}
            text={t('common.copied')}
            disabled
          >
            {shortenAddress(address)}
          </MouseoverTooltip>
          {shouldShowActions &&
            (isCopied ? (
              <CheckCircle size={16} color={statusSuccess.val} />
            ) : (
              <Copy data-testid="breadcrumb-hover-copy" width={16} height={16} color={neutral2.val} />
            ))}
        </TokenAddressHoverContainer>
      )}
    </CurrentPageBreadcrumbContainer>
  )
}
