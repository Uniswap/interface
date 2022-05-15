import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import SendIcon from 'src/assets/icons/send.svg'
import ShareIcon from 'src/assets/icons/share.svg'
import AddressEnsDisplay from 'src/components/accounts/AddressEnsDisplay'
import { Identicon } from 'src/components/accounts/Identicon'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { selectFollowedAddressSet } from 'src/features/favorites/selectors'
import { addFollow, removeFollow } from 'src/features/favorites/slice'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<AppStackParamList, Screens.User>

export function UserScreen({
  route: {
    params: { address },
  },
}: Props) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const onShare = async () => {
    if (!address) return
    try {
      await Share.share({
        message: address,
      })
    } catch (e) {
      logger.error('UserShare', 'onShare', 'Error sharing account address', e)
    }
  }

  const isFollowing = useAppSelector(selectFollowedAddressSet).has(address)

  const onFollowPress = () => {
    if (isFollowing) {
      dispatch(removeFollow({ address }))
    } else {
      dispatch(addFollow({ address }))
    }
  }

  if (!address)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <Text>todo blank state</Text>
        </Box>
      </Screen>
    )

  return (
    <Screen>
      {/* header */}
      <Flex row alignItems="center" justifyContent="space-between" mt="lg" px="lg">
        <BackButton color="deprecated_gray100" />
        <Flex centered row gap="lg">
          <Button>
            <SendIcon
              color={theme.colors.deprecated_gray600}
              height={24}
              strokeWidth={2.5}
              width={24}
            />
          </Button>
          <Button name={ElementName.ShareButton} onPress={onShare}>
            <ShareIcon color={theme.colors.deprecated_gray600} height={28} width={28} />
          </Button>
        </Flex>
      </Flex>
      {/* profile info */}
      <Flex row alignItems="center" justifyContent="space-between" mt="xl" px="lg" width={'100%'}>
        {/* address group */}
        <Flex centered row gap="md">
          <Identicon address={address} size={50} />
          <AddressEnsDisplay address={address} secondarySize={14} />
        </Flex>
        {/* follow button */}
        <Button
          alignItems="center"
          backgroundColor={isFollowing ? 'deprecated_gray50' : 'deprecated_blue'}
          borderColor={isFollowing ? 'deprecated_gray100' : 'deprecated_blue'}
          borderRadius="lg"
          borderWidth={1}
          px="md"
          py="xxs"
          onPress={onFollowPress}>
          <Text color="deprecated_textColor" fontSize={14} variant="subHead1">
            {isFollowing ? t('Following') : t('Follow')}
          </Text>
        </Button>
      </Flex>
    </Screen>
  )
}
