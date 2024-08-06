import styled from 'styled-components';
import { Trans } from 'i18n';
import { AutoColumn } from 'components/Column';
import { ThemedText } from 'theme/components';
import { ButtonLight } from "components/Button";
import { useAccountDrawer } from "components/AccountDrawer/MiniPortfolio/hooks";
import { useAccount } from 'hooks/useAccount';
import NetworkTypeMenu from "./NetworkTypeMenu";
import DatePickerValue from './DatePickerValue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import TimePickerValue from './TimePickerValue';
import { useEffect, useState } from 'react';

dayjs.extend(utc);

export enum NetworkType {
    Type1 = 'Evmos/Forge',
    Type2 = 'Polygon/Uniswap'
}

const HeaderText = styled(ThemedText.DeprecatedLabel)`
  align-items: center;
  display: flex;
  font-size: 20px;
  font-weight: 535 !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    font-size: 16px;
  `};
`;

const ResponsiveColumn = styled(AutoColumn)`
  grid-template-columns: 1fr;
  margin-top: 32px;
  width: 100%;
  gap: 8px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    gap: 8px;
  `};
  justify-content: space-between;
`;

const ValueInput = styled.input`
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => 'gray'};
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
    border-color: ${({ theme }) => theme.accent1};
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
`;

const CustomP = styled.p`
margin: 0px;
font-size: 16px;
display: block;
`;

const CustomDiv = styled.div`
margin: 0px;
gap: 12px;
display:flex;
align-items: center;
`;

export default function Create() {
    const account = useAccount();
    const accountDrawer = useAccountDrawer();
    const today = dayjs().utc().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, 'day').utc().format("YYYY-MM-DD");

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(tomorrow);

    const [startTime, setStartTime] = useState("12:00");
    const [endTime, setEndTime] = useState("12:00");

    const [startDateFormat, setStartDateFormat] = useState("");
    const [endDateFormat, setEndDateFormat] = useState("");

    useEffect(() => {
        const formattedStartDate = dayjs(startDate).format("MMMM D, YYYY");
        const formattedEndDate = dayjs(endDate).format("MMMM D, YYYY");
        setStartDateFormat(formattedStartDate);
        setEndDateFormat(formattedEndDate);
    }, [startDate, endDate]);

    const [rewardTokenAddress, setRewardTokenAddress] = useState('');
    const [borderColor, setBorderColor] = useState('gray');

    const isValidEthereumAddress = (address: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const handleRewardTokenAddressChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        setRewardTokenAddress(value);

        // Validate the address
        if (isValidEthereumAddress(value)) {
            setBorderColor('gray');
        } else if (value === "") {
            setBorderColor('gray');
        } else {
            setBorderColor('red');
        }
    };

    const [rewardsAmount, setRewardsAmount] = useState('');
    const handleRewardsAmountChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;

        // Allow only numbers and empty string
        if (/^\d*\.?\d*$/.test(value)) {
            setRewardsAmount(value);
        }
    };

    return (
        <>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.select.network.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.select.network.description" />
                </ThemedText.DeprecatedBody>
                <NetworkTypeMenu networkType={NetworkType.Type2} />
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.token.reward.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.set.token.reward.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput
                    placeholder='Reward token address'
                    value={rewardTokenAddress}
                    onChange={handleRewardTokenAddressChange}
                    style={{ borderColor }}
                />
            </ResponsiveColumn>
            {borderColor === "gray" ? (<CustomP><Trans i18nKey="common.create.incentives.set.token.reward.explaination" /></CustomP>) : (<CustomP style={{ color: 'red' }}><Trans i18nKey="common.create.incentives.set.token.reward.notValid" /></CustomP>)}
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.select.reward.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.select.reward.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput
                    placeholder='Rewards amount'
                    value={rewardsAmount}
                    onChange={handleRewardsAmountChange}
                />
            </ResponsiveColumn>

            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.pool.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.set.pool.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput placeholder='Pool Address' />
                <CustomP><Trans i18nKey="common.create.incentives.set.pool.explaination" /></CustomP>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.incentives.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.set.incentives.description" />
                </ThemedText.DeprecatedBody>
                <CustomDiv>
                    <DatePickerValue date={today} labelName="Start Date" onDateChange={setStartDate} />
                    <TimePickerValue labelName="Start Time" onTimeChange={setStartTime} />
                    <CustomP>Starts on {startDateFormat} at {startTime}</CustomP>
                </CustomDiv>
                <CustomDiv>
                    <DatePickerValue date={tomorrow} labelName="End Date" onDateChange={setEndDate} />
                    <TimePickerValue labelName="End TIme" onTimeChange={setEndTime} />
                    <CustomP>Ends on {endDateFormat} at {endTime}</CustomP>
                </CustomDiv>
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.set.vesting.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.set.vesting.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput placeholder='Vesting period in days' />
            </ResponsiveColumn>
            <ResponsiveColumn>
                <HeaderText>
                    → <Trans i18nKey="common.create.incentives.enter.refundee.title" />
                </HeaderText>
                <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485, fontSize: 16 }}>
                    <Trans i18nKey="common.create.incentives.enter.refundee.description" />
                </ThemedText.DeprecatedBody>
                <ValueInput placeholder='Refundee address' />
            </ResponsiveColumn>
            {!account.address ?
                (<ButtonLight
                    onClick={accountDrawer.open}
                    fontWeight={535}
                    $borderRadius="16px"
                    marginTop={2}
                >
                    <Trans i18nKey="common.connectWallet.button" />
                </ButtonLight>) : (
                    <ButtonLight
                        fontWeight={535}
                        $borderRadius="16px"
                        marginTop={2}>
                        <Trans i18nKey="common.incentives.create.button" />
                    </ButtonLight>
                )
            }
        </>
    );
}
