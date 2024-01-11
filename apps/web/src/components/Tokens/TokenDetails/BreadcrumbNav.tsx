import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Row from 'components/Row'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useScreenSize } from 'hooks/useScreenSize'
import { useCallback, useState } from 'react'
import { Copy } from 'react-feather'
import { Link } from 'react-router-dom'
import { useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css, useTheme } from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils/addresses'

import ShareButton from './ShareButton'

export const BreadcrumbNavContainer = styled.nav<{ isInfoTDPEnabled?: boolean }>`
  display: flex;
  color: ${({ theme }) => theme.neutral1};
  ${({ isInfoTDPEnabled }) =>
    isInfoTDPEnabled
      ? css`
          font-size: 16px;
          line-height: 24px;
        `
      : css`
          font-size: 14px;
          line-height: 20px;
        `}
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  width: fit-content;
`

export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.neutral2};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.neutral3};
  }
`

const CurrentBreadcrumbContainer = styled(Row)`
  gap: 6px;
`

// This must be an h1 to match the SEO title, and must be the first heading tag in code.
const PageTitleText = styled.h1`
  font-weight: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
`

const TokenAddressHoverContainer = styled(Row)`
  cursor: pointer;
  gap: 10px;
  white-space: nowrap;
`

const HoverActionsDivider = styled.div`
  height: 16px;
  width: 1px;
  background-color: ${({ theme }) => theme.surface3};
`

const CopyIcon = styled(Copy)`
  ${ClickableStyle}
`
const StyledCopiedSuccess = styled(Row)`
  gap: 4px;
`
const CopiedSuccess = () => {
  const { success } = useTheme()
  return (
    <StyledCopiedSuccess>
      <Copy width={16} height={16} color={success} />
      <ThemedText.Caption color="success">
        <Trans>Copied!</Trans>
      </ThemedText.Caption>
    </StyledCopiedSuccess>
  )
}

export const CurrentBreadcrumb = ({ address, currency }: { address: string; currency: Currency }) => {
  const { neutral2 } = useTheme()
  const screenSize = useScreenSize()
  const [hover, setHover] = useState(false)

  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(address)
  }, [address, setCopied])

  const isNative = currency.isNative
  const tokenSymbolName = currency && (currency.symbol ?? <Trans>Symbol not found</Trans>)

  const shareModalOpen = useModalIsOpen(ApplicationModal.SHARE)
  const shouldShowActions = (screenSize['sm'] && hover && !isCopied) || shareModalOpen

  return (
    <CurrentBreadcrumbContainer
      aria-current="page"
      data-testid="current-breadcrumb"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <PageTitleText>{tokenSymbolName}</PageTitleText>{' '}
      {!isNative && (
        <TokenAddressHoverContainer data-testid="breadcrumb-token-address" onClick={copy}>
          ( {shortenAddress(address)} )
          {shouldShowActions && (
            <>
              <CopyIcon data-testid="breadcrumb-hover-copy" width={16} height={16} color={neutral2} />
              <HoverActionsDivider />
            </>
          )}
          {isCopied && <CopiedSuccess />}
        </TokenAddressHoverContainer>
      )}
      {shouldShowActions && <ShareButton currency={currency} />}
    </CurrentBreadcrumbContainer>
  )
}
