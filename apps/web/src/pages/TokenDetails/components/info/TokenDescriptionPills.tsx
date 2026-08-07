import type { ComponentProps } from 'react'
import { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatableCopyIcon, Flex, styled, Text, TouchableArea } from 'ui/src'
import { BlockExplorer } from 'ui/src/components/icons/BlockExplorer'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { Lock } from 'ui/src/components/icons/Lock'
import { Page } from 'ui/src/components/icons/Page'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { iconSizes } from 'ui/src/theme'
import type { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { MultichainAddressList } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressList'
import { MultichainExplorerList } from 'uniswap/src/components/MultichainTokenDetails/MultichainExplorerList'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PermissionedTokenTooltip } from 'uniswap/src/features/permissionedTokens/PermissionedTokenTooltip'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isAllowedExternalUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { FOTTooltipContent } from '~/features/Swap/SwapLineItemTooltips'
import {
  MultichainPillDropdown,
  TokenInfoButton,
  tokenPillStyles,
} from '~/pages/TokenDetails/components/info/MultichainPillDropdown'
import type { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

const TRUNCATE_CHARACTER_COUNT = 300

function truncateDescription(desc: string, maxCharacterCount = TRUNCATE_CHARACTER_COUNT) {
  let truncated = desc.slice(0, maxCharacterCount)
  truncated = `${truncated.slice(0, Math.min(truncated.length, truncated.lastIndexOf(' ')))}...`
  return truncated
}

const TokenDescriptionContainer = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  maxWidth: '100%',
  maxHeight: 'fit-content',
  ...EllipsisTamaguiStyle,
  whiteSpace: 'pre-wrap',
  lineHeight: 24,
})

export function TokenLinkButton({
  uri,
  icon,
  name,
  onPress,
}: {
  uri: string
  icon: JSX.Element
  name: string
  onPress?: () => void
}) {
  if (!isAllowedExternalUri(uri)) {
    logger.warn('TokenLinkButton', 'render', 'Blocked unsafe external URL', { uri, name })
    return null
  }
  return (
    <TouchableArea
      tag="a"
      role="link"
      href={uri}
      target="_blank"
      rel="noopener noreferrer"
      {...tokenPillStyles}
      $platform-web={{ textDecorationLine: 'none' }}
      onPress={onPress}
    >
      {icon}
      <Text variant="buttonLabel3" color="$neutral1">
        {name}
      </Text>
    </TouchableArea>
  )
}

// "Permissioned" chip shown in the TDP About row only when the connected wallet is on the
// token's allowlist (verified state). Hover reveals the verified-with-issuer tooltip per
// Figma node 15-10825. The chip itself is not interactive — `cursor: default` and no
// hover/press styles — per designer note: "different appearance so as not to look interactive".
export function PermissionedPill({ issuer }: { issuer: string | undefined }) {
  const { t } = useTranslation()
  return (
    <PermissionedTokenTooltip
      baseText={t('permissionedPool.tooltip.lockIcon')}
      verifiedSuffix={issuer ? t('permissionedPool.tooltip.lockIcon.verifiedSuffix', { issuer }) : undefined}
      trigger={
        <Flex {...tokenPillStyles} cursor="default" hoverStyle={undefined} pressStyle={undefined}>
          <Lock size="$icon.16" color="$neutral2" />
          <Text variant="buttonLabel3" color="$neutral1">
            {t('permissionedPool.tdp.permissioned')}
          </Text>
        </Flex>
      }
    />
  )
}

// Vertical separator placed between the non-interactive Permissioned chip and the
// interactive action pills that follow it.
export function PermissionedActionRowDivider() {
  return <Flex width={1} alignSelf="stretch" backgroundColor="$surface3" />
}

export function DescriptionBody({ description }: { description: string | undefined }) {
  const { t } = useTranslation()
  const [isDescriptionTruncated, toggleIsDescriptionTruncated] = useReducer((x) => !x, true)
  const truncated = truncateDescription(description ?? '', TRUNCATE_CHARACTER_COUNT)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT
  const showTruncated = shouldTruncate && isDescriptionTruncated

  return (
    <TokenDescriptionContainer>
      {!description && (
        <Text variant="body2" color="$neutral3">
          {t('tdp.noInfoAvailable')}
        </Text>
      )}
      {description && (
        <Text tag="h2" variant="body2" color="$neutral2" whiteSpace="normal">
          {showTruncated ? (
            <span data-testid={TestID.TokenDetailsDescriptionTruncated}>{truncated}</span>
          ) : (
            <span data-testid={TestID.TokenDetailsDescriptionFull}>{description}</span>
          )}
        </Text>
      )}
      {shouldTruncate && (
        <TouchableArea
          onPress={toggleIsDescriptionTruncated}
          data-testid="token-description-show-more-button"
          display="inline"
        >
          <Text display="inline" variant="buttonLabel2" ml="$spacing8" textWrap="nowrap">
            {isDescriptionTruncated ? t('common.showMore.button') : t('common.hide.button')}
          </Text>
        </TouchableArea>
      )}
    </TokenDescriptionContainer>
  )
}

export function FeeTooltip({
  symbol,
  buyFeeString,
  sellFeeString,
}: {
  symbol: string | undefined
  buyFeeString: string
  sellFeeString: string
}) {
  const { t } = useTranslation()
  const sameFee = sellFeeString === buyFeeString
  return (
    <MouseoverTooltip
      placement="left"
      size={TooltipSize.Small}
      text={
        <Text variant="body4" color="$neutral2" lineHeight={16}>
          <FOTTooltipContent />
        </Text>
      }
    >
      <Flex gap="$gap8">
        {sameFee ? (
          <Text variant="body2" color="$neutral1">
            {symbol}&nbsp;
            {t('token.fee.label')}
            :&nbsp;{sellFeeString}
          </Text>
        ) : (
          <>
            <Text variant="body2" color="$neutral1">
              {symbol}&nbsp;
              {t('token.fee.buy.label')}
              :&nbsp;{buyFeeString}
            </Text>{' '}
            <Text variant="body2" color="$neutral1">
              {symbol}&nbsp;
              {t('token.fee.sell.label')}
              :&nbsp;{sellFeeString}
            </Text>{' '}
          </>
        )}
      </Flex>
    </MouseoverTooltip>
  )
}

export type AboutPillsProps = {
  isNative: boolean
  showMultichainDropdowns: boolean
  selectedMultichainChainId: UniverseChainId | undefined
  multichainEntries: ReturnType<typeof useMultichainTokenEntries>
  multichainPopoverContentProps: ComponentProps<typeof MultichainPillDropdown>['popoverContentProps']
  onCopyMultichainAddress: (address: string, chainId: UniverseChainId) => void
  isAddressOpen: boolean
  setIsAddressOpen: (open: boolean) => void
  isExplorerOpen: boolean
  setIsExplorerOpen: (open: boolean) => void
  copy: () => void
  isCopied: boolean
  displayAddress: string
  explorerUrl: string
  explorerName: string
  ExplorerIcon: ReturnType<typeof getBlockExplorerIcon>
  homepageUrl: string | undefined
  twitterName: string | undefined
  handleExplorerPress: (url: string, chainId: UniverseChainId) => void
  handleSingleChainExplorerPress: () => void
}

export function AddressPill(props: AboutPillsProps) {
  const { t } = useTranslation()
  if (props.isNative) {
    return null
  }
  if (props.showMultichainDropdowns) {
    return (
      <MultichainPillDropdown
        testID={TestID.MultichainAddressDropdown}
        icon={<Page size="$icon.16" color="$neutral1" />}
        name={t('common.address')}
        isOpen={props.isAddressOpen}
        onOpenChange={props.setIsAddressOpen}
        popoverContentProps={props.multichainPopoverContentProps}
        modalName={ModalName.MultichainAddressModal}
      >
        <MultichainAddressList chains={props.multichainEntries} onCopyAddress={props.onCopyMultichainAddress} />
      </MultichainPillDropdown>
    )
  }
  const showSelectedChainIcon = !!props.selectedMultichainChainId
  return (
    <TokenInfoButton
      onPress={props.copy}
      icon={
        showSelectedChainIcon && props.selectedMultichainChainId ? (
          <NetworkLogo chainId={props.selectedMultichainChainId} size={iconSizes.icon16} />
        ) : (
          <Page size="$icon.16" color="$neutral1" />
        )
      }
      iconRight={
        showSelectedChainIcon ? (
          <AnimatableCopyIcon isCopied={props.isCopied} size={iconSizes.icon16} textColor="$neutral1" />
        ) : undefined
      }
      name={shortenAddress({ address: props.displayAddress })}
    />
  )
}

export function ExplorerPill(props: AboutPillsProps) {
  const { t } = useTranslation()
  if (props.showMultichainDropdowns) {
    return (
      <MultichainPillDropdown
        testID={TestID.MultichainExplorerDropdown}
        icon={<BlockExplorer size="$icon.16" color="$neutral1" />}
        name={t('common.explorer')}
        isOpen={props.isExplorerOpen}
        onOpenChange={props.setIsExplorerOpen}
        popoverContentProps={props.multichainPopoverContentProps}
        modalName={ModalName.MultichainExplorerModal}
      >
        <MultichainExplorerList chains={props.multichainEntries} onExplorerPress={props.handleExplorerPress} />
      </MultichainPillDropdown>
    )
  }
  const showGenericIcon = !!props.selectedMultichainChainId
  const ExplorerIcon = props.ExplorerIcon
  return (
    <TokenLinkButton
      uri={props.explorerUrl}
      icon={
        showGenericIcon ? (
          <BlockExplorer size="$icon.16" color="$neutral1" />
        ) : (
          <ExplorerIcon size="$icon.16" color="$neutral1" />
        )
      }
      name={props.explorerName}
      onPress={props.handleSingleChainExplorerPress}
    />
  )
}

export function WebsitePill({ homepageUrl }: { homepageUrl: string | undefined }) {
  const { t } = useTranslation()
  if (!homepageUrl) {
    return null
  }
  return (
    <TokenLinkButton
      uri={homepageUrl}
      icon={<GlobeFilled size="$icon.16" color="$neutral1" />}
      name={t('common.website')}
    />
  )
}

export function TwitterPill({ twitterName }: { twitterName: string | undefined }) {
  const { t } = useTranslation()
  if (!twitterName) {
    return null
  }
  return (
    <TokenLinkButton
      uri={`https://x.com/${twitterName}`}
      icon={<XTwitter size="$icon.16" color="$neutral1" />}
      name={t('common.twitter')}
    />
  )
}
