import { useTranslation } from 'react-i18next'
import { SignMessageRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { Icons, Text, XStack, YStack } from 'ui/src'
import { colors } from 'ui/src/theme/color'
import { opacify } from 'ui/src/theme/color/utils'
import { iconSizes } from 'ui/src/theme/iconSizes'

// TODO(EXT-315): revisit these colors and potentially codify them in Spore
const EDUCATION_BLUE = colors.networkArbitrum
const EDUCATION_BLUE_SOFT = opacify(4, EDUCATION_BLUE)

function SignatureEducationBox(): JSX.Element {
  const { t } = useTranslation()
  return (
    <YStack gap="$spacing8" padding="$spacing16" style={{ backgroundColor: EDUCATION_BLUE_SOFT }}>
      <XStack gap="$spacing8">
        <Icons.GraduationCap
          color={EDUCATION_BLUE}
          height={iconSizes.icon20}
          width={iconSizes.icon20}
        />
        <Text style={{ color: EDUCATION_BLUE }} variant="bodySmall">
          {t('What‘s a signature request?')}
        </Text>
      </XStack>
      <Text color="$neutral2" variant="bodySmall">
        {t(
          'A signature is required to prove that you own the wallet without exposing your private keys'
        )}
      </Text>
    </YStack>
  )
}

export const SignMessageDetails = ({ request }: { request: DappRequestStoreItem }): JSX.Element => {
  const signMessageRequest = request.dappRequest as SignMessageRequest
  if (!signMessageRequest) {
    throw new Error('No sign message request')
  }

  return (
    <>
      <XStack borderColor="$surface3" borderWidth={1} marginVertical="$spacing16" width="100%" />
      <YStack flex={1} gap="$spacing16" width="100%">
        <YStack
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          flex={1}
          gap="$spacing16"
          margin="$none"
          overflow="scroll"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12">
          <Text color="$neutral2" variant="bodySmall">
            {signMessageRequest.messageHex}
          </Text>
        </YStack>
        <SignatureEducationBox />
      </YStack>
    </>
  )
}
