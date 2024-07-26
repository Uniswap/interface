
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

const ValueInput = styled.input`
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => 'gray'}; // Set a consistent border color
  height: 100%;
  width: 400px;
  font-size: 18px;
  font-weight: 485;
  padding: 10px;
  color: ${({ theme }) => theme.neutral2};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  text-overflow: ellipsis;

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.surface1};
    border-color: ${({ theme }) => theme.accent1}; // Keep the same border color on focus
    color: ${({ theme }) => theme.neutral1};
  }

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }
  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
`

const CustomP = styled.p`
margin: 0px;
font-size:16px;
display:block;
`

export default function Create() {
    return (
        <>
            <ResponsiveColumn>
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
                <ValueInput placeholder='Reward token address' />
                <CustomP><Trans i18nKey="common.create.incentives.set.token.reward.explaination" /></CustomP>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.select.reward.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.select.reward.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput placeholder='Rewards amount' />
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.pool.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.set.pool.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput placeholder='Pool Address' />
                <CustomP><Trans i18nKey="common.create.incentives.set.pool.explaination" /></CustomP>
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
                <ValueInput placeholder='Vesting period in days' />
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.enter.refundee.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 20 }}>
                    <Trans i18nKey="common.create.incentives.enter.refundee.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput placeholder='Refundee address' />
            </ResponsiveColumn>
        </>

    )
}
