import { isExtensionApp } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, type InputProps, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { useENS } from 'uniswap/src/features/ens/useENS'

interface UnitagProfileFormProps {
  address: string
  loading: boolean
  bioInput?: string
  twitterInput?: string
  onBioChange: (value: string) => void
  onTwitterChange: (value: string) => void
}

const inputProps: InputProps = {
  blurOnSubmit: true,
  fontFamily: '$body',
  fontSize: '$medium',
  fontWeight: '300',
  p: '$none',
  placeholderTextColor: '$neutral3',
  returnKeyType: 'done',
  textAlign: 'left',
  borderRadius: isExtensionApp ? 0 : undefined,
}

export function UnitagProfileForm({
  address,
  loading,
  bioInput,
  twitterInput,
  onBioChange,
  onTwitterChange,
}: UnitagProfileFormProps): JSX.Element {
  const { t } = useTranslation()
  const { name: ensName } = useENS({
    nameOrAddress: address,
    autocompleteDomain: true,
  })

  return (
    <Flex row gap="$spacing24" px={isExtensionApp ? '$none' : '$spacing16'} pt="$spacing16">
      <Flex flex={1.5} gap="$spacing24">
        <Text color="$neutral2" pt="$spacing4" variant="subheading1">
          {t('unitags.profile.bio.label')}
        </Text>
        <Text color="$neutral2" variant="subheading1">
          {t('unitags.profile.links.twitter')}
        </Text>
        {ensName && (
          <Text color="$neutral2" variant="subheading1">
            ENS
          </Text>
        )}
      </Flex>
      <Flex flex={2.5} gap="$spacing24">
        {!loading && (
          <>
            <TextInput
              autoCorrect
              height={fonts.subheading1.lineHeight}
              placeholder={t('unitags.profile.bio.placeholder')}
              value={bioInput}
              verticalAlign="top"
              {...inputProps}
              mt="$spacing4"
              onChangeText={onBioChange}
            />
            <Flex row gap="$none">
              <Text color="$neutral3">@</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                height={fonts.subheading1.lineHeight}
                placeholder={t('unitags.editProfile.placeholder')}
                value={twitterInput}
                verticalAlign="top"
                onChangeText={onTwitterChange}
                {...inputProps}
              />
            </Flex>
          </>
        )}
        {ensName && (
          <Text color="$neutral2" variant="body2">
            {ensName}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
