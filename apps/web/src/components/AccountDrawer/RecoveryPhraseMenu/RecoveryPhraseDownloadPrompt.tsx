import { useTranslation } from 'react-i18next'
import { Flex, Image, Text, TouchableArea, useSporeColors } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { AppStoreLogo } from 'ui/src/components/icons/AppStoreLogo'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'
import { iconSizes, opacify } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import flowersImage from '~/assets/images/recovery-phrase-flowers.png'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { GooglePlayStoreLogo } from '~/components/Icons/GooglePlayStoreLogo'
import { RECOVERY_PHRASE_DOWNLOAD_PROMPT_ONELINK } from '~/utils/openDownloadApp'

const ICON_DROP_SHADOW =
  'drop-shadow(0px 2px 2.5px rgba(18, 18, 23, 0.03)) drop-shadow(0px 6px 6px rgba(18, 18, 23, 0.04))'

const FADE_OVERLAY = (color: string) => {
  return `linear-gradient(270deg, ${opacify(0, color)} 0%, ${opacify(100, color)} 100%)`
}

function CardBackground() {
  const { surface1 } = useSporeColors()
  return (
    <Flex position="absolute" top={0} right={0} bottom={0} width="30%" overflow="hidden">
      <Flex
        position="absolute"
        top="-50%"
        left="-50%"
        width="200%"
        height="200%"
        style={{
          backgroundImage: `url(${flowersImage})`,
          backgroundSize: '200% auto',
          backgroundPosition: '75% 50%',
          backgroundRepeat: 'no-repeat',
          filter: `blur(8.5px)`,
          pointerEvents: 'none',
          opacity: 0.65,
          transform: 'rotate(-125deg)',
        }}
      />
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        style={{ background: FADE_OVERLAY(surface1.val), pointerEvents: 'none' }}
      />
    </Flex>
  )
}

function DownloadCard({
  title,
  background,
  iconSlot,
  onPress,
  testID,
}: {
  title: string
  background: React.ReactNode
  iconSlot: React.ReactNode
  onPress: () => void
  testID?: string
}) {
  return (
    <TouchableArea
      onPress={onPress}
      borderColor="$surface3"
      borderWidth={1}
      borderRadius="$rounded16"
      backgroundColor="$surface1"
      overflow="hidden"
      hoverStyle={{ opacity: 0.8 }}
      testID={testID}
    >
      <Flex row alignItems="center" height={60}>
        {background}
        <Flex flex={1} pl="$spacing16" zIndex={1}>
          <Text variant="body2" color="$neutral1">
            {title}
          </Text>
        </Flex>
        <Flex row alignItems="center" justifyContent="center" width={96} height="100%" gap="$spacing4" zIndex={1}>
          {iconSlot}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function RecoveryPhraseDownloadPrompt({
  onBack,
  onContinueOnWeb,
}: {
  onBack: () => void
  onContinueOnWeb: () => void
}) {
  const { t } = useTranslation()

  const onPressMobile = (): void => {
    window.open(RECOVERY_PHRASE_DOWNLOAD_PROMPT_ONELINK, '_blank', 'noopener,noreferrer')
  }

  const onPressExtension = (): void => {
    window.open(uniswapUrls.chromeExtension, '_blank', 'noopener,noreferrer')
  }

  return (
    <Trace logImpression modal={ModalName.RecoveryPhraseDownloadPrompt}>
      <SlideOutMenu title={t('settings.setting.recoveryPhrase.title')} onClose={onBack}>
        <Flex gap="$gap24" px="$padding8">
          <Flex gap="$gap16">
            <Image source={UNISWAP_LOGO} width={iconSizes.icon48} height={iconSizes.icon48} />

            <Flex gap="$gap8" pr="$spacing24">
              <Text variant="subheading1" color="$neutral1">
                {t('setting.recoveryPhrase.downloadPrompt.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {t('setting.recoveryPhrase.downloadPrompt.subtitle')}
              </Text>
            </Flex>
          </Flex>

          <Flex gap="$gap8">
            <Trace logPress element={ElementName.UniswapWalletModalDownloadButton}>
              <DownloadCard
                title={t('common.mobileApp')}
                background={<CardBackground />}
                onPress={onPressMobile}
                iconSlot={
                  <Flex row alignItems="center" gap="$spacing4" style={{ filter: ICON_DROP_SHADOW }}>
                    <AppStoreLogo size={iconSizes.icon28} />
                    <Flex
                      width={28}
                      height={28}
                      backgroundColor="$black"
                      borderRadius="$rounded6"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <GooglePlayStoreLogo width={iconSizes.icon20} height={iconSizes.icon20} />
                    </Flex>
                  </Flex>
                }
              />
            </Trace>
            <Trace logPress element={ElementName.ExtensionDownloadButton}>
              <DownloadCard
                title={t('common.browserExtension')}
                background={<CardBackground />}
                onPress={onPressExtension}
                iconSlot={
                  <Flex
                    width={28}
                    height={28}
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor="$white"
                    borderRadius="$rounded6"
                    style={{ filter: ICON_DROP_SHADOW }}
                  >
                    <GoogleChromeLogo size={22} />
                  </Flex>
                }
              />
            </Trace>
          </Flex>

          <Trace logPress element={ElementName.RecoveryPhraseContinueOnWeb}>
            <TouchableArea
              onPress={onContinueOnWeb}
              alignSelf="center"
              px="$spacing16"
              py="$spacing12"
              hoverStyle={{ opacity: 0.8 }}
            >
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="buttonLabel3" color="$neutral2">
                  {t('setting.recoveryPhrase.downloadPrompt.continueOnWeb')}
                </Text>
                <ArrowRight size="$icon.16" color="$neutral2" />
              </Flex>
            </TouchableArea>
          </Trace>
        </Flex>
      </SlideOutMenu>
    </Trace>
  )
}
