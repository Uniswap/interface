import { ModalContent } from 'components/NavBar/DownloadApp/Modal/Content'
import ms from 'ms'
import { useEffect, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ClickableTamaguiStyle, CopyHelper } from 'theme/components'
import { Flex, Loader, Text, styled } from 'ui/src'
import { EyeSlash } from 'ui/src/components/icons/EyeSlash'
import { LockedDocument } from 'ui/src/components/icons/LockedDocument'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { exportSeedPhraseWithPasskey } from 'uniswap/src/data/rest/embeddedWallet'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useOnClickOutside } from 'utilities/src/react/hooks'

const StyledX = styled(X, {
  color: '$neutral2',
  zIndex: 1,
  ...ClickableTamaguiStyle,
})

const StyledModal = styled(Modal, {
  position: 'relative',
})

function Seed({ seed, position, revealed }: { seed?: string; position: number; revealed?: boolean }) {
  return seed ? (
    revealed ? (
      <Flex flexDirection="row" gap="$gap8">
        <Text variant="body2" lineHeight="24px" color="$neutral2" width="$gap16">
          {position}
        </Text>
        <Text variant="body2" lineHeight="24px">
          {seed}
        </Text>
      </Flex>
    ) : (
      <Flex
        flexShrink={0}
        width="100%"
        height="16px"
        mb="$padding8"
        backgroundColor="$surface3"
        borderRadius="$rounded16"
      />
    )
  ) : (
    <Loader.Box flexShrink={0} width="100%" height="18px" mb="$padding8" />
  )
}

export function RecoveryPhraseModal() {
  const { t } = useTranslation()
  const isOpen = useModalIsOpen(ModalName.RecoveryPhrase)
  const closeModal = useCloseModal()
  const [seedPhrase, setSeedPhrase] = useState<string[] | undefined>(undefined)
  const [isRevealed, setIsRevealed] = useState(false)
  const handleClose = () => {
    closeModal()
    setIsRevealed(false)
    setSeedPhrase(undefined)
  }
  const seedPhraseContentRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(seedPhraseContentRef, () => setIsRevealed(false))

  const fetchSeedPhrase = async () => {
    const retrievedSeedPhrase = await exportSeedPhraseWithPasskey()
    setSeedPhrase(retrievedSeedPhrase)
  }

  // After revealing passphrase, hide it after 1 minute
  const handleReveal = () => {
    setIsRevealed(true)
    setTimeout(() => {
      setIsRevealed(false)
    }, ms('1m'))
  }

  useEffect(() => {
    if (isOpen) {
      fetchSeedPhrase()
    }
  }, [isOpen])

  return (
    <StyledModal name={ModalName.RecoveryPhrase} isModalOpen={isOpen} onClose={handleClose} maxWidth={464}>
      <Flex position="absolute" top="32px" right="32px">
        <StyledX onClick={handleClose} />
      </Flex>
      <ModalContent
        title={t('setting.recoveryPhrase.title')}
        subtext={t('setting.recoveryPhrase.view.warning.message1')}
        logo={
          <Flex p="$spacing12" background="$surface3" borderRadius="$rounded12">
            <LockedDocument size="$icon.24" />
          </Flex>
        }
      >
        <Flex
          p="$spacing32"
          gap="$spacing36"
          flexDirection="row"
          borderRadius="$rounded20"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="$surface2"
          width="100%"
          position="relative"
          backgroundColor="$surface2"
          ref={seedPhraseContentRef}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Flex flexShrink={0} key={`recovery-phrase-cover-col-${i}`} gap="$gap16" width="88px">
              {Array.from({ length: 4 }).map((_, j) => {
                const index = i * 4 + j + 1
                return (
                  <Seed
                    key={`recovery-phrase-item-${index}`}
                    seed={seedPhrase?.[index - 1]}
                    position={index}
                    revealed={isRevealed}
                  />
                )
              })}
            </Flex>
          ))}
          {!!seedPhrase && !isRevealed && (
            <Flex
              position="absolute"
              py="$padding8"
              px="10px"
              gap="$gap4"
              flexDirection="row"
              alignItems="center"
              backgroundColor="$surface1"
              borderRadius="$rounded16"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="$surface2"
              top="50%"
              left="50%"
              hoverStyle={{ opacity: 0.6 }}
              cursor="pointer"
              userSelect="none"
              transform="translate(-50%, -50%)" // TamaguiClickableStyle (animate) breaks this transform
              onPress={handleReveal}
            >
              <EyeSlash minHeight={20} minWidth={20} color="$accent1" />
              <Text variant="buttonLabel3" color="$accent1">
                {t('common.button.reveal')}
              </Text>
            </Flex>
          )}
          {isRevealed && !!seedPhrase && (
            <Flex
              py="$padding8"
              px="10px"
              gap="$gap4"
              opacity={0.8}
              borderRadius="$rounded20"
              background="$surface1"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="$surface3"
              position="absolute"
              left="50%"
              top="0"
              transform="translate(-50%, -50%)" // TamaguiClickableStyle (animate) breaks this transform
              zIndex={1}
              hoverStyle={{ opacity: 0.6 }}
              cursor="pointer"
              userSelect="none"
              onPress={() => {
                setTimeout(() => {
                  setIsRevealed(false)
                }, 500) // Allows Copy animation to finish before hiding
              }}
            >
              <CopyHelper iconSize={20} iconPosition="left" toCopy={seedPhrase?.join(' ')}>
                {t('common.button.copy')}
              </CopyHelper>
            </Flex>
          )}
        </Flex>
      </ModalContent>
    </StyledModal>
  )
}
