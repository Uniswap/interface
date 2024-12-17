import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { BackButtonView } from 'src/components/layout/BackButtonView'
import { SeedPhraseDisplay } from 'src/components/mnemonic/SeedPhraseDisplay'
import { APP_STORE_LINK } from 'src/constants/urls'
import { UpgradeStatus } from 'src/features/forceUpgrade/types'
import { Button, Flex, Image, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { imageSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { DynamicConfigs, ForceUpgradeConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function ForceUpgradeModal(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const forceUpgradeStatusString = useDynamicConfigValue(
    DynamicConfigs.ForceUpgrade,
    ForceUpgradeConfigKey.Status,
    '' as string,
  )

  const [isVisible, setIsVisible] = useState(false)
  const [upgradeStatus, setUpgradeStatus] = useState(UpgradeStatus.NotRequired)

  // signerAccounts could be empty if no seed phrase imported or in onboarding
  const signerAccounts = useSignerAccounts()
  const mnemonicId = signerAccounts.length > 0 ? (signerAccounts?.[0] as SignerMnemonicAccount)?.mnemonicId : undefined

  const [showSeedPhrase, setShowSeedPhrase] = useState(false)

  useEffect(() => {
    let status = UpgradeStatus.NotRequired
    if (forceUpgradeStatusString === 'recommended') {
      status = UpgradeStatus.Recommended
    } else if (forceUpgradeStatusString === 'required') {
      status = UpgradeStatus.Required
    }
    setUpgradeStatus(status)
    setIsVisible(status !== UpgradeStatus.NotRequired)
  }, [forceUpgradeStatusString])

  const onPressConfirm = async (): Promise<void> => {
    await openUri(APP_STORE_LINK, /*openExternalBrowser=*/ true, /*isSafeUri=*/ true)
  }

  const onClose = (): void => {
    setIsVisible(false)
  }

  const onPressViewRecovery = (): void => {
    setShowSeedPhrase(true)
  }

  const onDismiss = (): void => {
    setShowSeedPhrase(false)
  }

  // We do not add explicit error boundary here as we can not hide or replace
  // the force upgrade screen on error, hence we fallback to the global error boundary
  return (
    <>
      <Modal
        backgroundColor={colors.surface1.val}
        hideHandlebar={upgradeStatus === UpgradeStatus.Required}
        isDismissible={upgradeStatus !== UpgradeStatus.Required}
        isModalOpen={isVisible}
        name={ModalName.ForceUpgradeModal}
        onClose={onClose}
      >
        <Flex
          centered
          gap="$spacing24"
          pb={isWeb ? '$none' : '$spacing12'}
          pt={upgradeStatus === UpgradeStatus.Required ? '$spacing24' : '$spacing12'}
          px={isWeb ? '$none' : '$spacing24'}
        >
          <Flex
            centered
            width="100%"
            height={160}
            borderRadius="$rounded16"
            borderWidth={1}
            borderColor="$surface3"
            overflow="hidden"
          >
            <Flex
              centered
              borderRadius="$rounded16"
              style={{
                shadowColor: colors.accent1.val,
                elevation: 8,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
              borderWidth={1}
              borderColor="$surface3"
              elevationAndroid={8}
            >
              <Flex position="relative">
                <Image
                  height={imageSizes.image64}
                  resizeMode="contain"
                  source={UNISWAP_LOGO}
                  width={imageSizes.image64}
                />
                <Flex position="absolute" top={-15} right={-8} transform={[{ rotate: '10deg' }]}>
                  <NewTag exclamation backgroundColor="$accent1" textColor="$white" />
                </Flex>
              </Flex>
            </Flex>
            <BackgroundDotPattern />
          </Flex>
          <Flex gap="$spacing8">
            <Text textAlign="center" variant="subheading1">
              {t('forceUpgrade.title')}
            </Text>
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('forceUpgrade.description')}
            </Text>
          </Flex>
          <Flex centered gap="$spacing8" pb={isWeb ? '$none' : '$spacing12'} width="100%">
            <Button size="medium" theme="primary" width="100%" onPress={onPressConfirm}>
              <Text color="$white" variant="buttonLabel2">
                {t('forceUpgrade.action.confirm')}
              </Text>
            </Button>

            {mnemonicId && (
              <Button size="medium" theme="secondary" width="100%" onPress={onPressViewRecovery}>
                <Text color="$neutral1" variant="buttonLabel2">
                  {t('forceUpgrade.action.recoveryPhrase')}
                </Text>
              </Button>
            )}
          </Flex>
        </Flex>
      </Modal>
      {mnemonicId && showSeedPhrase && (
        <Modal fullScreen backgroundColor={colors.surface1.val} name={ModalName.ForceUpgradeModal} onClose={onDismiss}>
          <Flex fill gap="$spacing16" px="$spacing24" py="$spacing24">
            <Flex row alignItems="center" justifyContent="flex-start">
              <TouchableArea onPress={onDismiss}>
                <BackButtonView size={BACK_BUTTON_SIZE} />
              </TouchableArea>
              <Text variant="subheading1">{t('forceUpgrade.label.recoveryPhrase')}</Text>
              <Flex width={BACK_BUTTON_SIZE} />
            </Flex>
            <SeedPhraseDisplay mnemonicId={mnemonicId} onDismiss={onDismiss} />
          </Flex>
        </Modal>
      )}
    </>
  )
}

const BACK_BUTTON_SIZE = 24

function BackgroundDotPattern(): JSX.Element {
  const colors = useSporeColors()
  const dotGrid = useMemo(() => {
    return Array.from({ length: 100 }).map((_, row) => {
      return Array.from({ length: 100 }).map((__, col) => {
        const x = col * 2 + 1
        const y = row * 2 + 1

        const distX = Math.abs(x - 50)
        const distY = Math.abs(y - 50)
        const dist = Math.sqrt(distX * distX + distY * distY)

        if (dist < 45) {
          const size = 0.1 + (45 - dist) / 20

          return <Circle key={`${row}-${col}`} cx={`${x}%`} cy={`${y}%`} r={size} fill={colors.pinkThemed.val} />
        }
        return null
      })
    })
  }, [colors])

  return (
    <Svg width={400} height={400} style={[styles.backgroundPattern, styles.centered]}>
      {dotGrid}
    </Svg>
  )
}

const styles = StyleSheet.create({
  backgroundPattern: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1,
  },
  centered: {
    left: '50%',
    top: '50%',
    transform: [{ translateX: -200 }, { translateY: -200 }],
  },
})
