import { Currency } from '@uniswap/sdk-core'
import { Flex, Text } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { Presence } from '@universe/mycelium/presence'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { PoolData } from '~/data/pools/poolData'
import { Container, PageLayout } from '~/features/Liquidity/Create/Container'
import { CreatePositionHeader } from '~/features/Liquidity/Create/CreatePositionHeader'
import { EditSelectTokensStep } from '~/features/Liquidity/Create/EditStep'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'
import { usePoolProgressSteps } from '~/features/Liquidity/Create/hooks/usePoolProgressSteps'
import { SelectPriceRangeStep } from '~/features/Liquidity/Create/RangeSelectionStep'
import { SelectTokensStep } from '~/features/Liquidity/Create/SelectTokenStep'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { DepositStep } from '~/features/Liquidity/Deposit'
import {
  PoolProgressIndicator,
  PoolProgressIndicatorHeader,
  SIDEBAR_WIDTH,
} from '~/features/Liquidity/PoolProgressIndicator/PoolProgressIndicator'
import { ADD_LIQUIDITY_PATH } from '~/pages/AddLiquidity/poolLinkParams'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

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
            <Presence>
              {showSelectStep && (
                <Flex className="data-exiting:animate-spore-exit-fade-out opacity-[1]">
                  <Trace logImpression section={selectSectionName}>
                    <SelectTokensStep
                      isMigration={isMigration}
                      currencyInputs={currencyInputs}
                      onContinue={onSelectTokensContinue}
                      setCurrencyInputs={setCurrencyInputs}
                    />
                  </Trace>
                </Flex>
              )}
            </Presence>
            {showEditStep && <EditSelectTokensStep poolData={poolData} />}
          </HeightAnimator>
        </Container>
      )}

      <Presence>
        {(step === PositionFlowStep.PRICE_RANGE || step === PositionFlowStep.DEPOSIT) && (
          <Container
            // The 210ms stagger delays only the enter — the data-exiting class zeroes it so the
            // exit starts immediately. fill-mode `both` holds the hidden enter frame through the
            // stagger and the faded exit frame until unmount.
            className="animate-spore-enter-fade-in-down data-exiting:animate-spore-exit-fade-out opacity-[1] [animation-delay:210ms] data-exiting:[animation-delay:0ms]"
            style={{ animationFillMode: 'both' }}
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
      </Presence>
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
  const navigate = useNavigate()
  const location = useLocation()
  // `useEntryPointBreadcrumb` already returns the `/positions` fallback when there's no entry point, so
  // it can be passed straight through (matches AddLiquidity.tsx).
  const entryPointBreadcrumb = useEntryPointBreadcrumb()
  // A linkable `/positions/add/new` (bookmark/fresh tab) has no in-app history, so a bare navigate(-1)
  // would dead-end. `location.state.from` marks an in-app entry — pop to it; otherwise fall back to the
  // pool browser. Mirrors AddLiquidity.tsx's handleBack for the sibling surface.
  const handleBack = useCallback(() => {
    if (location.state && (location.state as { from?: string }).from) {
      navigate(-1)
    } else {
      navigate(ADD_LIQUIDITY_PATH)
    }
  }, [navigate, location.state])
  // Migration supplies its own title and breadcrumb, so these fallbacks only ever describe the
  // create-pool leg, which is entered via "Create pool".
  const fallbackTitle = t('addLiquidity.createPool')
  const fallbackTrailingLabel = t('addLiquidity.createPool')
  const isTrailingBreadcrumbEmphasized = entryPointBreadcrumb.hasEntryPoint || !isMigration
  const trailingBreadcrumb = currentBreadcrumb ?? (
    // Entry-point breadcrumbs use the active color because they describe the current create-position flow.
    <Text color={isTrailingBreadcrumbEmphasized ? '$neutral1' : '$neutral2'}>{title || fallbackTrailingLabel}</Text>
  )

  const poolProgressSteps = usePoolProgressSteps({ isMigration })

  return (
    <PageLayout mt="$spacing24">
      <CreatePositionHeader
        leadingBreadcrumb={entryPointBreadcrumb}
        trailingBreadcrumb={trailingBreadcrumb}
        onBack={isMigration ? undefined : handleBack}
        title={title || fallbackTitle}
        actions={toolbar}
      />
      {!sidebar && media.xl && <PoolProgressIndicatorHeader steps={poolProgressSteps} />}
      <Flex row gap="$spacing20" justifyContent="space-between" width="100%">
        {!media.xl && (sidebar ?? <PoolProgressIndicator steps={poolProgressSteps} />)}
        <Flex
          gap="$spacing24"
          flex={1}
          maxWidth={isMigration ? WIDTH.positionCard : undefined}
          mb="$spacing28"
          $xl={{ maxWidth: '100%' }}
        >
          {children}
        </Flex>
      </Flex>
    </PageLayout>
  )
}
