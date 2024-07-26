
import styled from 'styled-components'
import { Trans } from 'i18n'
import { AutoColumn } from 'components/Column'
import { ThemedText } from 'theme/components'

const HeaderText = styled(ThemedText.DeprecatedLabel)`
  align-items: center;
  display: flex;
  font-size: 24px;
  font-weight: 535 !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    font-size: 16px;
  `};
`

const ResponsiveColumn = styled(AutoColumn)`
  grid-template-columns: 1fr;
  margin-top: 32px;
  width: 100%;
  gap: 8px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    gap: 8px;
  `};
  justify-content: space-between;
`

export default function Create() {
    return (
        <><ResponsiveColumn>
            <HeaderText>
                → <Trans i18nKey="common.create.incentives.select.network.title" />
            </HeaderText>
            <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                <Trans i18nKey="common.create.incentives.select.network.description" />
            </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.token.reward.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.set.token.reward.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.select.reward.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.select.reward.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.pool.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.set.pool.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.incentives.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.set.incentives.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.vesting.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.set.vesting.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.enter.refundee.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.enter.refundee.description" />
                </ThemedText.DeprecatedBody>
            </ResponsiveColumn>
        </>

    )
}
