import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { setCloseModal } from 'state/application/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { Button, Flex, IconButton, styled, Text } from 'ui/src'
import { SOLANA_BANNER_LIGHT, SOLANA_LOGO } from 'ui/src/assets'
import { Chart } from 'ui/src/components/icons/Chart'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { X } from 'ui/src/components/icons/X'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'

const GradientContainer = styled(Flex, {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',

  borderTopLeftRadius: '$rounded16',
  borderTopRightRadius: '$rounded16',
  minHeight: 120,

  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',

  // Apply an opacity mask to create a fade effect from top to bottom
  // Top is less transparent (12% visible), bottom is more transparent (0% visible)
  mask: 'linear-gradient(180deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
})

const IconContainer = styled(Flex, {
  width: 40,
  height: 40,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '$rounded6',
})

const FeatureRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
})

const FeatureIcon = styled(Flex, {
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
})

export default function SolanaPromoModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isOpen = useAppSelector((state) => state.application.openModal?.name === ModalName.SolanaPromo)
  const { t } = useTranslation()

  const handleClose = useEvent(() => {
    dispatch(setCloseModal(ModalName.SolanaPromo))
  })

  const handleStartSwapping = useEvent(() => {
    handleClose()
    navigate('/swap?chain=solana')
  })

  return (
    <Modal isModalOpen={isOpen} name={ModalName.SolanaPromo} onClose={handleClose} maxWidth={440} padding="$none">
      <Flex p="$spacing24" gap="$spacing24">
        <GradientContainer backgroundImage={`url(${SOLANA_BANNER_LIGHT})`} />

        {/* Header */}
        <Flex alignItems="flex-start" gap="$spacing16" pt="$spacing16">
          <IconContainer backgroundImage={`url(${SOLANA_LOGO})`} />
          <Flex gap="$spacing4">
            <Text variant="subheading1" color="$neutral1">
              {t('solanaPromo.banner.title')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('solanaPromo.banner.description')}
            </Text>
          </Flex>
        </Flex>

        {/* Value prop list */}
        <Flex gap="$spacing8" mx="$spacing8">
          <FeatureRow>
            <FeatureIcon>
              <Lightning size={20} color="$accent1" />
            </FeatureIcon>
            <Text variant="body3" color="$neutral2">
              {t('solanaPromo.modal.swapInstantly')}
            </Text>
          </FeatureRow>

          <FeatureRow>
            <FeatureIcon>
              <Wallet size={20} color="$accent1" />
            </FeatureIcon>
            <Text variant="body3" color="$neutral2">
              {t('solanaPromo.modal.connectWallet')}
            </Text>
          </FeatureRow>

          <FeatureRow>
            <FeatureIcon>
              <Chart size={20} color="$accent1" />
            </FeatureIcon>
            <Text variant="body3" color="$neutral2">
              {t('solanaPromo.modal.viewTokenData')}
            </Text>
          </FeatureRow>
        </Flex>

        {/* Button */}
        <Trace logPress element={ElementName.SolanaPromoStartSwappingButton}>
          <Button size="large" emphasis="primary" onPress={handleStartSwapping} width="100%" minHeight="$spacing48">
            {t('solanaPromo.modal.startSwapping.button')}
          </Button>
        </Trace>

        {/* Close button */}
        <IconButton
          position="absolute"
          right="$spacing16"
          top="$spacing16"
          size="small"
          emphasis="secondary"
          onPress={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          icon={<X />}
          p={8}
          scale={0.8}
        />
      </Flex>
    </Modal>
  )
}
