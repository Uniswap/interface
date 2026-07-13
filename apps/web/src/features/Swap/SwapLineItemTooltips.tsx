import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from '~/theme/components/Links'

function BaseTooltipContent({ children, url }: { children: ReactNode; url: string }) {
  const { t } = useTranslation()
  return (
    <>
      {children}
      <br />
      <ExternalLink href={url}>{t('common.button.learn')}</ExternalLink>
    </>
  )
}

/** Shared swap UI copy; consumed outside the limit-order flow (e.g. token details). */
export function FOTTooltipContent() {
  const { t } = useTranslation()
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee-">
      {t('swap.tokenOwnFees')}
    </BaseTooltipContent>
  )
}

export function SlippageTooltipContent() {
  const { t } = useTranslation()
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/20131678274957">
      {t('swap.slippage.tooltip')}
    </BaseTooltipContent>
  )
}

export function SwapFeeTooltipContent({ hasFee }: { hasFee: boolean }) {
  const { t } = useTranslation()
  const message = hasFee ? t('swap.fees.experience') : t('swap.fees.noFee')
  return (
    <BaseTooltipContent url="https://support.uniswap.org/hc/en-us/articles/20131678274957">
      {message}
    </BaseTooltipContent>
  )
}
