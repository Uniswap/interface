import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import {
  PoolProgressIndicator,
  PoolProgressIndicatorHeader,
  SIDEBAR_WIDTH,
} from '~/components/PoolProgressIndicator/PoolProgressIndicator'
import {
  useCreateAuctionStore,
  useCreateAuctionStoreActions,
} from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
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

  const progressSteps = useMemo(() => {
    const createStep = ({ label, stepEnum }: { label: string; stepEnum: CreateAuctionStep }) => ({
      label,
      active: step === stepEnum,
      onPress: () => {
        if (stepEnum < step) {
          setStep(stepEnum)
        }
      },
    })

    return [
      createStep({ label: t('toucan.createAuction.step.tokenInfo'), stepEnum: CreateAuctionStep.ADD_TOKEN_INFO }),
      createStep({
        label: t('toucan.createAuction.step.configureAuction'),
        stepEnum: CreateAuctionStep.CONFIGURE_AUCTION,
      }),
      createStep({ label: t('toucan.createAuction.step.customizePool'), stepEnum: CreateAuctionStep.CUSTOMIZE_POOL }),
      // Review step intentionally excluded - shown inline without step navigation
    ]
  }, [step, setStep, t])

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
        px: '$spacing8',
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
        <Text variant="heading2">{t('toucan.createAuction.title')}</Text>
      </Flex>
      {media.xl && step !== CreateAuctionStep.REVIEW_LAUNCH && <PoolProgressIndicatorHeader steps={progressSteps} />}
      <Flex row gap="$spacing20" justifyContent="space-between" width="100%">
        {!media.xl && step !== CreateAuctionStep.REVIEW_LAUNCH && <PoolProgressIndicator steps={progressSteps} />}
        <Flex gap="$spacing24" flex={1} maxWidth={WIDTH.positionCard} mb="$spacing28" $xl={{ maxWidth: '100%' }}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
