import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Globe } from 'ui/src/components/icons/Globe'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { SectionHeader } from '~/pages/Liquidity/CreateAuction/components/reviewLaunch/ReviewLaunchStepPrimitives'
import { TokenMode, type TokenFormState } from '~/pages/Liquidity/CreateAuction/types'
import { resolveCreateNewTokenDisplayImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveCreateNewTokenDisplayImageSrc'
import { stripTrailingSlashesFromWebsiteUrl } from '~/pages/Liquidity/CreateAuction/websiteLink'

const TOKEN_LOGO_SIZE = 60

interface ReviewLaunchTokenInfoSectionProps {
  tokenForm: TokenFormState
  tokenName: string
  tokenSymbol: string
  description: string | undefined
  xProfile: string | undefined
  websiteLink: string | undefined
  onEditTokenInfo: () => void
}

export function ReviewLaunchTokenInfoSection({
  tokenForm,
  tokenName,
  tokenSymbol,
  description,
  xProfile,
  websiteLink,
  onEditTokenInfo,
}: ReviewLaunchTokenInfoSectionProps): JSX.Element {
  const { t } = useTranslation()

  const websiteLinkDisplay = websiteLink
    ? stripTrailingSlashesFromWebsiteUrl(websiteLink.replace(/^https?:\/\//i, ''))
    : ''

  return (
    <Flex gap="$spacing20">
      <SectionHeader title={t('toucan.createAuction.step.tokenInfo.title')} onEdit={onEditTokenInfo} />

      <Flex row alignItems="center" gap="$spacing16">
        {tokenForm.mode === TokenMode.CREATE_NEW ? (
          <TokenLogo
            url={resolveCreateNewTokenDisplayImageSrc(tokenForm.localImagePreviewUri, tokenForm.imageUrl) ?? null}
            symbol={tokenForm.symbol}
            name={tokenForm.name}
            chainId={tokenForm.network}
            size={TOKEN_LOGO_SIZE}
          />
        ) : (
          <CurrencyLogo currencyInfo={tokenForm.existingTokenCurrencyInfo ?? null} size={TOKEN_LOGO_SIZE} />
        )}
        <Flex flex={1} gap="$spacing4">
          <Text variant="heading3" color="$neutral1">
            {tokenName}
          </Text>
          <Text variant="body2" color="$neutral2">
            {tokenSymbol}
          </Text>
        </Flex>
      </Flex>

      {description ? (
        <Text variant="body2" color="$neutral1">
          {description}
        </Text>
      ) : null}

      {xProfile || websiteLink ? (
        <Flex row flexWrap="wrap" gap="$spacing8">
          {xProfile ? (
            <Flex
              backgroundColor="$surface3"
              borderRadius="$roundedFull"
              flexDirection="row"
              alignItems="center"
              gap="$spacing8"
              pl="$spacing8"
              pr="$spacing12"
              py="$spacing6"
            >
              <XTwitter size="$icon.16" color="$neutral1" />
              <Text variant="buttonLabel3" color="$neutral1">
                @{xProfile}
              </Text>
            </Flex>
          ) : null}
          {websiteLink ? (
            <Flex
              backgroundColor="$surface3"
              borderRadius="$roundedFull"
              flexDirection="row"
              alignItems="center"
              gap="$spacing8"
              pl="$spacing8"
              pr="$spacing12"
              py="$spacing6"
            >
              <Globe size="$icon.16" color="$neutral1" />
              <Text variant="buttonLabel3" color="$neutral1">
                {websiteLinkDisplay}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  )
}
