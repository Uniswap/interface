import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { AnimatePresence, Flex, HeightAnimator, Text, TouchableArea, useMedia } from 'ui/src'
import { ArrowLeft } from 'ui/src/components/icons/ArrowLeft'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { Container, PageLayout } from '~/features/Liquidity/Create/Container'
import { EditSelectTokensStep } from '~/features/Liquidity/Create/EditStep'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'
import { SelectPriceRangeStep } from '~/features/Liquidity/Create/RangeSelectionStep'
import { SelectTokensStep } from '~/features/Liquidity/Create/SelectTokenStep'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { DepositStep } from '~/features/Liquidity/Deposit'
import {
  PoolProgressIndicator,
  PoolProgressIndicatorHeader,
  SIDEBAR_WIDTH,
} from '~/features/Liquidity/PoolProgressIndicator/PoolProgressIndicator'
import {
  DEFAULT_PRICE_RANGE_STATE,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'

const WIDTH = {
  positionCard: 720,
  sidebar: SIDEBAR_WIDTH,
}

export function FormStepsWrapper({
  isMigration = false,
  hideEditStepOnDesktop = false,
  currencyInputs,
  setCurrencyInputs,
  selectSectionName = SectionName.CreatePositionSelectTokensStep,
  priceRangeSectionName = SectionName.CreatePositionPriceRangeStep,
  priceRangeProps,
  onSelectTokensContinue,
  poolData,
}: {
  isMigration?: boolean
  hideEditStepOnDesktop?: boolean
  currencyInputs: { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
  setCurrencyInputs: Dispatch<SetStateAction<{ tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }>>
  selectSectionName?: SectionName
  priceRangeProps?: React.ComponentProps<typeof SelectPriceRangeStep>
  priceRangeSectionName?: SectionName
  onSelectTokensContinue: () => void
  poolData?: PoolData
}) {
  const { step } = useCreateLiquidityContext()
  const media = useMedia()

  const hideEditStep = hideEditStepOnDesktop && !media.xl
  const showEditStep = (step === PositionFlowStep.PRICE_RANGE || step === PositionFlowStep.DEPOSIT) && !hideEditStep
  const showSelectStep = step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER

  return (
    <>
      {(showSelectStep || showEditStep) && (
        <Container>
          <HeightAnimator animation="200ms">
            <AnimatePresence>
              {showSelectStep && (
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
            {showEditStep && <EditSelectTokensStep poolData={poolData} />}
          </HeightAnimator>
        </Container>
      )}

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
  sidebar,
  children,
}: {
  title?: string
  toolbar: JSX.Element
  isMigration?: boolean
  currentBreadcrumb?: JSX.Element
  sidebar?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const { setStep, creatingPoolOrPair, protocolVersion, step, setPriceRangeState } = useCreateLiquidityContext()
  const navigate = useNavigate()
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const { pathname } = useLocation()
  const showPoolsBreadcrumb = isAddLiquidityRevamp && pathname.startsWith('/positions/add/')
  const entryPointBreadcrumb = useEntryPointBreadcrumb()

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
    <PageLayout mt="$spacing24">
      <BreadcrumbNavContainer aria-label="breadcrumb-nav">
        {showPoolsBreadcrumb ? (
          <>
            <BreadcrumbNavLink to={entryPointBreadcrumb.to}>
              {entryPointBreadcrumb.label} <Chevron size="$icon.16" color="$neutral2" rotate="180deg" />
            </BreadcrumbNavLink>
            <Text color="$neutral1">{title || t('position.new')}</Text>
          </>
        ) : (
          <>
            <BreadcrumbNavLink to="/positions">
              {t('pool.positions.title')} <Chevron size="$icon.16" color="$neutral2" rotate="180deg" />
            </BreadcrumbNavLink>
            {currentBreadcrumb || <Text color="$neutral2">{t('pool.newPosition.title')}</Text>}
          </>
        )}
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
        <Flex row alignItems="center" gap="$spacing8">
          {showPoolsBreadcrumb && (
            <TouchableArea onPress={() => navigate(-1)}>
              <ArrowLeft size="$icon.24" color="$neutral1" />
            </TouchableArea>
          )}
          <Text variant="heading2">{title || t('position.new')}</Text>
        </Flex>
        {toolbar}
      </Flex>
      {!sidebar && media.xl && <PoolProgressIndicatorHeader steps={poolProgressSteps} />}
      <Flex row gap="$spacing20" justifyContent="space-between" width="100%">
        {!media.xl && (sidebar ?? <PoolProgressIndicator steps={poolProgressSteps} />)}
        <Flex gap="$spacing24" flex={1} maxWidth={WIDTH.positionCard} mb="$spacing28" $xl={{ maxWidth: '100%' }}>
          {children}
        </Flex>
      </Flex>
    </PageLayout>
  )
}
