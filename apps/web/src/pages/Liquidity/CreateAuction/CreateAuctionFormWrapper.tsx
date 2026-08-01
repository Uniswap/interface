import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import {
  PoolProgressIndicator,
  PoolProgressIndicatorHeader,
  SIDEBAR_WIDTH,
} from '~/features/Liquidity/PoolProgressIndicator/PoolProgressIndicator'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useIsQuickLaunchMode } from '~/pages/Liquidity/CreateAuction/hooks/useIsQuickLaunchMode'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { CreateAuctionStep } from '~/pages/Liquidity/CreateAuction/types'

const WIDTH = {
  positionCard: 720,
  sidebar: SIDEBAR_WIDTH,
}

export function CreateAuctionFormWrapper({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const media = useMedia()
  const step = useCreateAuctionStore((state) => state.step)
  const { setStep } = useCreateAuctionStoreActions()
  const isStep0Valid = useIsStepValid(CreateAuctionStep.ADD_TOKEN_INFO)
  const isStep1Valid = useIsStepValid(CreateAuctionStep.CONFIGURE_AUCTION)
  const isQuickLaunchMode = useIsQuickLaunchMode()

  const progressSteps = useMemo(() => {
    // Quick launch collapses the wizard to a single configure step (Review stays excluded, as below).
    if (isQuickLaunchMode) {
      return [
        {
          label: t('toucan.createAuction.quickLaunch.step.title'),
          caption: t('toucan.createAuction.quickLaunch.title'),
          active: step === CreateAuctionStep.ADD_TOKEN_INFO,
        },
      ]
    }

    const stepValidities = [isStep0Valid, isStep1Valid]

    const createStep = ({ label, stepEnum }: { label: string; stepEnum: CreateAuctionStep }) => {
      const canNavigate = stepEnum < step || stepValidities.slice(0, stepEnum).every(Boolean)
      return {
        label,
        active: step === stepEnum,
        onPress: canNavigate ? () => setStep(stepEnum) : undefined,
      }
    }

    return [
      createStep({ label: t('toucan.createAuction.step.tokenInfo'), stepEnum: CreateAuctionStep.ADD_TOKEN_INFO }),
      createStep({
        label: t('toucan.createAuction.step.configureAuction'),
        stepEnum: CreateAuctionStep.CONFIGURE_AUCTION,
      }),
      createStep({ label: t('toucan.createAuction.step.customizePool'), stepEnum: CreateAuctionStep.CUSTOMIZE_POOL }),
      // Review step intentionally excluded - shown inline without step navigation
    ]
  }, [step, setStep, t, isStep0Valid, isStep1Valid, isQuickLaunchMode])

  return (
    <Flex
      mt="$spacing24"
      width="100%"
      px="$spacing40"
      maxWidth={WIDTH.positionCard + WIDTH.sidebar + 80}
      $xl={{
        px: '$spacing24',
        maxWidth: '100%',
        mx: 'auto',
      }}
      $sm={{
        px: '$spacing20',
      }}
    >
      <BreadcrumbNavContainer aria-label="breadcrumb-nav">
        <BreadcrumbNavLink to="/positions">
          {t('pool.positions.title')} <Chevron size="$icon.16" color="$neutral2" rotate="180deg" />
        </BreadcrumbNavLink>
      </BreadcrumbNavContainer>
      <Flex
        row
        alignSelf="flex-end"
        alignItems="center"
        gap="$gap20"
        width="100%"
        justifyContent="space-between"
        mr="auto"
        mb={media.xl ? '$spacing16' : '$spacing32'}
      >
        <Text variant="heading2">
          {step === CreateAuctionStep.REVIEW_LAUNCH
            ? t('toucan.createAuction.review.title')
            : t('toucan.createAuction.title')}
        </Text>
      </Flex>
      {media.xl && step !== CreateAuctionStep.REVIEW_LAUNCH && (
        <PoolProgressIndicatorHeader flush steps={progressSteps} />
      )}
      <Flex
        row
        gap="$spacing20"
        justifyContent={step === CreateAuctionStep.REVIEW_LAUNCH ? 'center' : 'space-between'}
        width="100%"
      >
        {!media.xl && step !== CreateAuctionStep.REVIEW_LAUNCH && <PoolProgressIndicator steps={progressSteps} />}
        <Flex gap="$spacing24" flex={1} maxWidth={WIDTH.positionCard} mb="$spacing28" $xl={{ maxWidth: '100%' }}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
