import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from 'components/BreadcrumbNav'
import { Container } from 'components/Liquidity/Create/Container'
import { EditSelectTokensStep } from 'components/Liquidity/Create/EditStep'
import { SelectPriceRangeStep } from 'components/Liquidity/Create/RangeSelectionStep'
import { SelectTokensStep } from 'components/Liquidity/Create/SelectTokenStep'
import { PositionFlowStep } from 'components/Liquidity/Create/types'
import { DepositStep } from 'components/Liquidity/Deposit'
import {
  PoolProgressIndicator,
  PoolProgressIndicatorHeader,
  SIDEBAR_WIDTH,
} from 'components/PoolProgressIndicator/PoolProgressIndicator'
import {
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, HeightAnimator, Text, useMedia } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

const WIDTH = {
  positionCard: 720,
  sidebar: SIDEBAR_WIDTH,
}

export function FormStepsWrapper({
  isMigration = false,
  currencyInputs,
  setCurrencyInputs,
  selectSectionName = SectionName.CreatePositionSelectTokensStep,
  priceRangeSectionName = SectionName.CreatePositionPriceRangeStep,
  priceRangeProps,
  onSelectTokensContinue,
}: {
  isMigration?: boolean
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
  selectSectionName?: SectionName
  priceRangeProps?: React.ComponentProps<typeof SelectPriceRangeStep>
  priceRangeSectionName?: SectionName
  onSelectTokensContinue: () => void
}) {
  const { step } = useCreateLiquidityContext()

  return (
    <>
      <Container>
        <HeightAnimator animation="200ms">
          <AnimatePresence>
            {step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER && (
              <Flex animation="125ms" exitStyle={{ opacity: 0 }}>
                <Trace logImpression section={selectSectionName}>
                  <SelectTokensStep
                    tokensLocked={isMigration}
                    currencyInputs={currencyInputs}
                    onContinue={onSelectTokensContinue}
                    setCurrencyInputs={setCurrencyInputs}
                  />
                </Trace>
              </Flex>
            )}
          </AnimatePresence>
          {(step === PositionFlowStep.PRICE_RANGE || step === PositionFlowStep.DEPOSIT) && <EditSelectTokensStep />}
        </HeightAnimator>
      </Container>

      <AnimatePresence>
        {(step === PositionFlowStep.PRICE_RANGE || step === PositionFlowStep.DEPOSIT) && (
          <Container
            // @ts-ignore - ignoring animation prop type issue with tamagui
            animation={['200ms', { delay: 210 }]}
            enterStyle={{ y: -10, opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          >
            {step === PositionFlowStep.PRICE_RANGE && (
              <Trace logImpression section={priceRangeSectionName}>
                <SelectPriceRangeStep {...priceRangeProps} />
                {!isMigration && <DepositStep />}
              </Trace>
            )}
            {!isMigration && step === PositionFlowStep.DEPOSIT && (
              <Trace logImpression section={SectionName.CreatePositionDepositStep}>
                <DepositStep />
              </Trace>
            )}
          </Container>
        )}
      </AnimatePresence>
    </>
  )
}

export function FormWrapper({
  title,
  toolbar,
  isMigration = false,
  currentBreadcrumb,
  children,
}: {
  title?: string
  toolbar: JSX.Element
  isMigration?: boolean
  currentBreadcrumb?: JSX.Element
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const { setStep, creatingPoolOrPair, protocolVersion, step, setPriceRangeState } = useCreateLiquidityContext()

  const poolProgressSteps = useMemo(() => {
    const createStep = ({
      label,
      stepEnum,
      onPress,
    }: {
      label: string
      stepEnum: PositionFlowStep
      onPress?: () => void
    }) => ({
      label,
      active: step === stepEnum,
      // This relies on the ordering of PositionFlowStep enum values matching the actual order in the form.
      onPress: () => {
        onPress?.()

        if (stepEnum < step) {
          setStep(stepEnum)
        }
      },
    })

    if (isMigration) {
      return [
        createStep({ label: t('migrate.selectFeeTier'), stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER }),
        createStep({ label: t('migrate.setRange'), stepEnum: PositionFlowStep.PRICE_RANGE }),
      ]
    }

    if (protocolVersion === ProtocolVersion.V2) {
      if (creatingPoolOrPair) {
        return [
          createStep({ label: t(`position.step.select`), stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER }),
          createStep({ label: t('position.step.price'), stepEnum: PositionFlowStep.PRICE_RANGE }),
        ]
      }
      return [
        createStep({ label: t('position.step.select'), stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER }),
        createStep({ label: t('position.step.deposit'), stepEnum: PositionFlowStep.DEPOSIT }),
      ]
    }

    return [
      createStep({
        label: t('position.step.select'),
        stepEnum: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
        onPress: () => setPriceRangeState(DEFAULT_PRICE_RANGE_STATE),
      }),
      createStep({ label: t('position.step.range'), stepEnum: PositionFlowStep.PRICE_RANGE }),
    ]
  }, [creatingPoolOrPair, protocolVersion, setStep, step, t, setPriceRangeState, isMigration])

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
        {currentBreadcrumb || <Text color="$neutral2">{t('pool.newPosition.title')}</Text>}
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
        $md={{ flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Text variant="heading2">{title || t('position.new')}</Text>
        {toolbar}
      </Flex>
      {media.xl && <PoolProgressIndicatorHeader steps={poolProgressSteps} />}
      <Flex row gap="$spacing20" justifyContent="space-between" width="100%">
        {!media.xl && <PoolProgressIndicator steps={poolProgressSteps} />}
        <Flex gap="$spacing24" flex={1} maxWidth={WIDTH.positionCard} mb="$spacing28" $xl={{ maxWidth: '100%' }}>
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
