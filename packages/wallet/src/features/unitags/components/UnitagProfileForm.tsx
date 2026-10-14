import { isExtensionApp } from '@universe/environment'
import { Flex, fonts, type InputProps, spacing, Text } from '@universe/mycelium'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent, TextLayoutEvent } from 'react-native'
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

const INPUT_LINE_HEIGHT = fonts.subheading1.lineHeight
// Settled heights of the two rows, used as a floor below. The bio row adds spacing4 above both
// of its columns (the label's pt and the input's mt); the twitter row has no such offset.
const BIO_ROW_MIN_HEIGHT = spacing.spacing4 + INPUT_LINE_HEIGHT
const TWITTER_ROW_MIN_HEIGHT = INPUT_LINE_HEIGHT
const LABEL_WIDTH = '35%'
const INPUT_WIDTH = '65%'

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
  const [bioLineCount, setBioLineCount] = useState(1)

  const onPlaceholderTextLayout = useCallback((event: TextLayoutEvent) => {
    setBioLineCount(Math.max(event.nativeEvent.lines.length, 1))
  }, [])

  const onPlaceholderLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    if (height <= 0) {
      return
    }

    setBioLineCount(Math.max(Math.ceil(height / INPUT_LINE_HEIGHT), 1))
  }, [])

  return (
    <Flex gap="$spacing24" px={isExtensionApp ? '$none' : '$spacing16'} pt="$spacing16">
      {/* Both rows pin their settled height as a floor. The form is content-sized, so nothing here
          has an outer height to fall back on: while Android relayouts the window for an IME hide,
          a row can resolve to zero height for a few frames, which drops the intrinsically-sized
          labels entirely and hoists the rows beneath it. */}
      <Flex row minHeight={BIO_ROW_MIN_HEIGHT}>
        <Flex pr="$spacing24" pt="$spacing4" width={LABEL_WIDTH}>
          <Text color="$neutral2" variant="subheading1">
            {t('unitags.profile.bio.label')}
          </Text>
        </Flex>
        <Flex width={INPUT_WIDTH}>
          {!loading && (
            <Flex fill>
              {/* Hidden text mirrors the placeholder to count wrapped lines and size the bio input height. */}
              <Text
                fontFamily="$body"
                fontSize="$medium"
                fontWeight="300"
                opacity={0}
                pointerEvents="none"
                position="absolute"
                width="100%"
                {...(isExtensionApp ? { onLayout: onPlaceholderLayout } : { onTextLayout: onPlaceholderTextLayout })}
              >
                {t('unitags.profile.bio.placeholder')}
              </Text>
              <TextInput
                multiline
                autoCorrect
                scrollEnabled
                height={INPUT_LINE_HEIGHT * bioLineCount}
                numberOfLines={bioLineCount}
                placeholder={t('unitags.profile.bio.placeholder')}
                scrollbarWidth="none"
                value={bioInput}
                verticalAlign="top"
                mt="$spacing4"
                onChangeText={onBioChange}
                {...inputProps}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex row minHeight={TWITTER_ROW_MIN_HEIGHT}>
        <Flex width={LABEL_WIDTH}>
          <Text color="$neutral2" variant="subheading1">
            {t('unitags.profile.links.twitter')}
          </Text>
        </Flex>
        <Flex width={INPUT_WIDTH}>
          {!loading && (
            <Flex row alignItems="center" width="100%">
              <Text color="$neutral3">@</Text>
              <TextInput
                flex={1}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                height={INPUT_LINE_HEIGHT}
                placeholder={t('unitags.editProfile.placeholder')}
                value={twitterInput}
                verticalAlign="top"
                onChangeText={onTwitterChange}
                {...inputProps}
              />
            </Flex>
          )}
        </Flex>
      </Flex>
      {ensName && (
        <Flex row width="100%">
          <Flex pr="$spacing24" width={LABEL_WIDTH}>
            <Text color="$neutral2" variant="subheading1">
              ENS
            </Text>
          </Flex>
          <Flex width={INPUT_WIDTH}>
            <Text color="$neutral2" variant="body2">
              {ensName}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
