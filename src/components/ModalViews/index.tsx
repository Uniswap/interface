import { useContractKit } from '@celo-tools/use-contractkit'
import { ChainId } from '@ubeswap/sdk'
import React, { useContext } from 'react'
import { ArrowUpCircle } from 'react-feather'
import { useTranslation } from 'react-i18next'
import styled, { ThemeContext } from 'styled-components'

import Circle from '../../assets/images/blue-loader.svg'
import { CloseIcon, CustomLightSpinner, TYPE } from '../../theme'
import { ExternalLink } from '../../theme/components'
import { AutoColumn, ColumnCenter } from '../Column'
import { RowBetween } from '../Row'

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

export function LoadingView({ children, onDismiss }: { children: any; onDismiss: () => void }) {
  const { t } = useTranslation()

  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <div />
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <ConfirmedIcon>
        <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
      </ConfirmedIcon>
      <AutoColumn gap="100px" justify={'center'}>
        {children}
        <TYPE.subHeader>{t('ConfirmThisTransactionInYourWallet')}</TYPE.subHeader>
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}

export function SubmittedView({
  children,
  onDismiss,
  hash,
}: {
  children: any
  onDismiss: () => void
  hash: string | undefined
}) {
  const theme = useContext(ThemeContext)
  const { network } = useContractKit()
  const chainId = network.chainId as unknown as ChainId

  const { t } = useTranslation()
  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <div />
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <ConfirmedIcon>
        <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
      </ConfirmedIcon>
      <AutoColumn gap="100px" justify={'center'}>
        {children}
        {chainId && hash && (
          <ExternalLink href={`${network.explorer}/tx/${hash}`} style={{ marginLeft: '4px' }}>
            <TYPE.subHeader>{t('ViewTransactionOnCeloExplorer')}</TYPE.subHeader>
          </ExternalLink>
        )}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}
