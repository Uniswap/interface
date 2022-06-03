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
import { IconButton } from 'src/components/buttons/IconButton'
import { AppBackground } from 'src/components/gradients'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Text } from 'src/components/Text'
import { selectFollowedAddressSet } from 'src/features/favorites/selectors'
import { addFollow, removeFollow } from 'src/features/favorites/slice'
import { NFTMasonry } from 'src/screens/PortfolioNFTs'
import { PortfolioTokens } from 'src/screens/PortfolioTokens'
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

  const isFollowing = useAppSelector(selectFollowedAddressSet).has(address)

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
    <Screen edges={['top', 'left', 'right']}>
      <AppBackground />
      <VirtualizedList>
        <Flex gap="md" mx="md">
          {/* header */}
          <Flex row alignItems="center" justifyContent="space-between">
            <BackButton color="deprecated_gray600" />
            <Flex row gap="xs">
              <IconButton
                icon={
                  <SendIcon
                    height={24}
                    stroke={theme.colors.deprecated_gray600}
                    strokeWidth={2.5}
                    width={24}
                  />
                }
              />
              <IconButton
                icon={<ShareIcon height={24} stroke={theme.colors.deprecated_gray600} width={24} />}
                onPress={onShare}
              />
            </Flex>
          </Flex>

          {/* profile info */}
          <Flex row alignItems="center" justifyContent="space-between" mb="md">
            {/* address group */}
            <Flex centered row gap="sm">
              <Identicon address={address} size={50} />
              <AddressEnsDisplay address={address} mainSize={20} secondarySize={14} />
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
              <Text fontWeight={'500'} variant="body2">
                {isFollowing ? t('Following') : t('Follow')}
              </Text>
            </Button>
          </Flex>
          <PortfolioTokens count={4} />
          <NFTMasonry count={16} />
        </Flex>
      </VirtualizedList>
    </Screen>
  )
}
