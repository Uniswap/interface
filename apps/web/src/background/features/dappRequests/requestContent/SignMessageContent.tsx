import { useTranslation } from 'react-i18next'
import { SignMessageRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { Flex, Icons, Text } from 'ui/src'
import { colors } from 'ui/src/theme/color'
import { opacify } from 'ui/src/theme/color/utils'

// TODO(EXT-315): revisit these colors and potentially codify them in Spore
const EDUCATION_BLUE = colors.networkArbitrum
const EDUCATION_BLUE_SOFT = opacify(4, EDUCATION_BLUE)

function SignatureEducationBox(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing8" p="$spacing16" style={{ backgroundColor: EDUCATION_BLUE_SOFT }}>
      <Flex row gap="$spacing8">
        <Icons.GraduationCap color={EDUCATION_BLUE} size="$icon.20" />
        <Text style={{ color: EDUCATION_BLUE }} variant="body2">
          {t('What’s a signature request?')}
        </Text>
      </Flex>
      <Text color="$neutral2" variant="body2">
        {t(
          'A signature is required to prove that you own the wallet without exposing your private keys'
        )}
      </Text>
    </Flex>
  )
}

export const SignMessageDetails = ({ request }: { request: DappRequestStoreItem }): JSX.Element => {
  const signMessageRequest = request.dappRequest as SignMessageRequest
  if (!signMessageRequest) {
    throw new Error('No sign message request')
  }

  return (
    <>
      <Flex row borderColor="$surface3" borderWidth={1} my="$spacing16" width="100%" />
      <Flex fill gap="$spacing16" width="100%">
        <Flex
          fill
          bg="$surface2"
          borderRadius="$rounded16"
          gap="$spacing16"
          m="$none"
          overflow="scroll"
          px="$spacing16"
          py="$spacing12">
          <Text color="$neutral2" variant="body2">
            {signMessageRequest.messageHex}
          </Text>
        </Flex>
        <SignatureEducationBox />
      </Flex>
    </>
  )
}
