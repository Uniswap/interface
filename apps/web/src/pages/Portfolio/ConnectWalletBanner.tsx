import { ReactComponent as UniconA } from 'assets/svg/Emblem/A.svg'
import { ReactComponent as UniconB } from 'assets/svg/Emblem/B.svg'
import { ReactComponent as UniconC } from 'assets/svg/Emblem/C.svg'
import { ReactComponent as UniconD } from 'assets/svg/Emblem/D.svg'
import { ReactComponent as UniconDefault } from 'assets/svg/Emblem/default.svg'
import { ReactComponent as UniconE } from 'assets/svg/Emblem/E.svg'
import { ReactComponent as UniconF } from 'assets/svg/Emblem/F.svg'
import { ReactComponent as UniconG } from 'assets/svg/Emblem/G.svg'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'

export default function PortfolioConnectWalletBanner() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const pinkPastel = '#FDAFF03F'
  const colors = useSporeColors()
  const media = useMedia()
  const showEmblems = !media.md

  return (
    <Flex
      height={216}
      backgroundColor="$accent2"
      centered
      gap="$spacing24"
      borderRadius="$rounded24"
      $platform-web={{
        backgroundImage: `linear-gradient(90deg, ${pinkPastel} 1px, transparent 1px), linear-gradient(0deg, ${pinkPastel} 1px, transparent 1px)`,
        backgroundSize: '12px 12px',
        backgroundPosition: '0 0',
      }}
      overflow="hidden"
    >
      {showEmblems && (
        <>
          <Flex position="absolute" top={20} left={-15} transform="rotate(90deg)">
            <UniconB
              width={71}
              height={71}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" bottom={20} left={180}>
            <UniconA
              width={71}
              height={71}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" top={30} left={120}>
            <UniconE
              width={71}
              height={71}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" bottom={30} left={50}>
            <UniconF
              width={65}
              height={65}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" top={70} right={150} transform="rotate(10deg)">
            <UniconDefault
              width={61}
              height={61}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" bottom={-35} right={75}>
            <UniconC
              width={76}
              height={76}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" top={35} right={35} transform="rotate(-10deg)">
            <UniconD
              width={62}
              height={62}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
          <Flex position="absolute" right={200} top={-15}>
            <UniconG
              width={69}
              height={69}
              style={{ color: colors.accent1.val }}
              fill={colors.accent1.val}
              opacity="0.25"
            />
          </Flex>
        </>
      )}
      <Text variant="body2" color="$neutral1">
        {t('common.connectAWallet.button')}{' '}
        <Text variant="body2" color="$neutral2">
          {t('portfolio.disconnected.viewYourPortfolio.cta')}
        </Text>
      </Text>
      <Flex row centered>
        <Button variant="branded" emphasis="primary" size="medium" width={164} onPress={accountDrawer.open}>
          {t('common.button.connect')}
        </Button>
      </Flex>
    </Flex>
  )
}
