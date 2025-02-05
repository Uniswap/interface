import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex, Separator, Text } from 'ui/src'
import { Clear, Signature } from 'ui/src/components/icons'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

interface NonStandardTypedDataRequestContentProps {
  dappRequest: SignTypedDataRequest
}

export function NonStandardTypedDataRequestContent({
  dappRequest,
}: NonStandardTypedDataRequestContentProps): JSX.Element {
  const { t } = useTranslation()
  const [checked, setChecked] = useState(false)

  const hasMessageToShow = !!dappRequest.typedData

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
      disableConfirm={!checked}
    >
      <Flex gap="$spacing16">
        <Flex
          backgroundColor="$surface2"
          borderColor="$surface3"
          borderRadius="$rounded16"
          borderWidth="$spacing1"
          flexDirection="column"
          gap="$spacing12"
          pt="$spacing12"
          pb={!hasMessageToShow ? '$spacing12' : undefined}
          overflow="hidden"
        >
          <Flex row px="$spacing12" gap="$spacing8" alignItems="center">
            <Clear color="$neutral2" size="$icon.16" />
            <Text variant="body3" color="$neutral2">
              {t('dapp.request.signature.decodeError')}
            </Text>
          </Flex>
          {hasMessageToShow && <Separator />}
          {hasMessageToShow && (
            <Flex maxHeight={150} $platform-web={{ overflowY: 'auto' }} px="$spacing16" gap="$spacing8">
              <Flex row gap="$spacing8" alignItems="center">
                <Signature color="$neutral2" size="$icon.16" />
                <Text variant="body3" color="$neutral2">
                  {t('common.message')}
                </Text>
              </Flex>
              <Text variant="body3" color="$neutral1">
                {dappRequest.typedData}
              </Text>
            </Flex>
          )}
        </Flex>
        <InlineWarningCard
          hideCtaIcon
          severity={WarningSeverity.Medium}
          heading={t('dapp.request.signature.irregular')}
          description={t('dapp.request.signature.irregular.description')}
          checkboxLabel={t('dapp.request.signature.irregular.understand')}
          checked={checked}
          setChecked={setChecked}
        />
      </Flex>
    </DappRequestContent>
  )
}
