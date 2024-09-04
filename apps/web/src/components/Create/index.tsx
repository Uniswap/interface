import styled from "styled-components";
import { Trans } from "i18n";
import { AutoColumn } from "components/Column";
import { ThemedText } from "theme/components";
import { ButtonLight } from "components/Button";
import { useAccountDrawer } from "components/AccountDrawer/MiniPortfolio/hooks";
import { useAccount } from "hooks/useAccount";
import NetworkTypeMenu from "./NetworkTypeMenu";
import DatePickerValue from "./DatePickerValue";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import TimePickerValue from "./TimePickerValue";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useV3StakerContract } from "./Hook";
import { Flex } from "ui/src";

dayjs.extend(utc);

export enum NetworkType {
  Type1 = "Evmos/Forge",
  Type2 = "Polygon/Uniswap",
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
  width: 100%;
  gap: 12px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    gap: 8px;
  `};
  justify-content: space-between;
`;

interface ValueInputProps {
  error?: boolean;
}

const ValueInput = styled.input<ValueInputProps>`
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 20px;
  border: 1px solid ${({ theme, error }) => (error ? "red" : "gray")};
  height: 100%;
  width: 100%;
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
  color: ${({ color }) => color || "black"};
`;

const CustomDiv = styled.div`
  margin: 0px;
  gap: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

interface InputFieldProps {
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean;
  errorMessage?: string;
}

function InputField({
  placeholder,
  value,
  onChange,
  error,
  errorMessage,
}: InputFieldProps) {
  return (
    <>
      <ValueInput
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        error={!!error}
      />
      {error && (
        <CustomP color="red">
          <Trans i18nKey={errorMessage} />
        </CustomP>
      )}
    </>
  );
}

export default function Create() {
  const account = useAccount();
  const accountDrawer = useAccountDrawer();
  const today = dayjs().utc().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").utc().format("YYYY-MM-DD");

  const v3StakerContract = useV3StakerContract(true);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("12:00");

  const [formattedStartDate, setFormattedStartDate] = useState(
    dayjs(today).format("MMMM D, YYYY")
  );
  const [formattedEndDate, setFormattedEndDate] = useState(
    dayjs(tomorrow).format("MMMM D, YYYY")
  );

  const [rewardTokenAddress, setRewardTokenAddress] = useState("");
  const [rewardsAmount, setRewardsAmount] = useState("");
  const [vestingPeriod, setVestingPeriod] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [refundeeAddress, setRefundeeAddress] = useState("");

  const [errorMessages, setErrorMessages] = useState({
    rewardToken: "",
    rewardsAmount: "",
    vestingPeriod: "",
    poolAddress: "",
    refundeeAddress: "",
    date: "",
  });

  useEffect(() => {
    setFormattedStartDate(dayjs(startDate).format("MMMM D, YYYY"));
    setFormattedEndDate(dayjs(endDate).format("MMMM D, YYYY"));
    validateDatesAndTimes();
  }, [startDate, endDate, startTime, endTime]);

  const validateDatesAndTimes = () => {
    const startDateTime = dayjs(`${startDate} ${startTime}`);
    const endDateTime = dayjs(`${endDate} ${endTime}`);

    setErrorMessages((prev) => ({
      ...prev,
      date: endDateTime.isBefore(startDateTime)
        ? "common.create.incentives.select.period"
        : "",
    }));
  };

  type SetterFunction = React.Dispatch<React.SetStateAction<string>>;
  type ValidatorFunction = (value: string) => boolean;

  const handleInputChange = (
    setter: SetterFunction,
    validator: ValidatorFunction,
    errorKey: keyof typeof errorMessages,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setter(value);

    setErrorMessages((prev) => {
      if (value === "") {
        return {
          ...prev,
          [errorKey]: `The ${errorKey.replace(
            /[A-Z]/g,
            (match) => " " + match.toLowerCase()
          )} is required.`,
        };
      } else {
        return {
          ...prev,
          [errorKey]: validator(value)
            ? ""
            : `common.create.incentives.set.token.notValid.${errorKey}`,
        };
      }
    });
  };

  const handleRewardTokenAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    handleInputChange(
      setRewardTokenAddress,
      isValidEthereumAddress,
      "rewardToken",
      e
    );

  const handlePoolAddressChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleInputChange(setPoolAddress, isValidEthereumAddress, "poolAddress", e);

  const handleRefundeeAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    handleInputChange(
      setRefundeeAddress,
      isValidEthereumAddress,
      "refundeeAddress",
      e
    );

  const handleRewardsAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleInputChange(
      setRewardsAmount,
      (val) => /^\d*\.?\d*$/.test(val),
      "rewardsAmount",
      e
    );

  const handleVestingPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleInputChange(
      setVestingPeriod,
      (val) => /^\d*\.?\d*$/.test(val),
      "vestingPeriod",
      e
    );

  const createIncentive = async () => {
    if (!rewardTokenAddress)
      setErrorMessages((prev) => ({
        ...prev,
        rewardToken: "The reward token address is required.",
      }));
    if (!rewardsAmount)
      setErrorMessages((prev) => ({
        ...prev,
        rewardsAmount: "The reward amount is required.",
      }));
    if (!poolAddress)
      setErrorMessages((prev) => ({
        ...prev,
        poolAddress: "The pool address is required.",
      }));
    if (!vestingPeriod)
      setErrorMessages((prev) => ({
        ...prev,
        vestingPeriod: "The vesting period is required.",
      }));
    if (!refundeeAddress)
      setErrorMessages((prev) => ({
        ...prev,
        refundeeAddress: "The refundee address is required.",
      }));

    if (
      rewardTokenAddress &&
      rewardsAmount &&
      poolAddress &&
      vestingPeriod &&
      refundeeAddress
    ) {
      try {
        const startedTime = Math.floor(
          new Date(`${startDate} ${startTime}`).getTime() / 1000
        );
        const endedTime = Math.floor(
          new Date(`${endDate} ${endTime}`).getTime() / 1000
        );
        const reward = ethers.utils.parseUnits(rewardsAmount, 18);
        const incentiveKey = {
          rewardToken: rewardTokenAddress,
          pool: poolAddress,
          startTime: startedTime,
          endTime: endedTime,
          refundee: refundeeAddress,
        };

        if (v3StakerContract) {
          const tx = await v3StakerContract.createIncentive(
            incentiveKey,
            reward
          );
          await tx.wait();

          alert("Incentive created successfully!");
        } else {
          alert("Contract is not available.");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to create incentive: " + error.message);
      }
    }
  };

  return (
    <Flex
      row={false}
      alignItems="center"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      gap={32}
      marginStart={0}
      style={{ padding: "32px", marginBottom: "35px" }}
    >
      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.select.network.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.select.network.description" />
        </ThemedText.DeprecatedBody>
        <NetworkTypeMenu networkType={NetworkType.Type2} />
      </ResponsiveColumn>

      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.set.token.reward.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.set.token.reward.description" />
        </ThemedText.DeprecatedBody>
        <InputField
          placeholder="Reward token address"
          value={rewardTokenAddress}
          onChange={handleRewardTokenAddressChange}
          error={!!errorMessages.rewardToken}
          errorMessage={errorMessages.rewardToken}
        />
      </ResponsiveColumn>

      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.select.reward.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.select.reward.description" />
        </ThemedText.DeprecatedBody>
        <InputField
          placeholder="Rewards amount"
          value={rewardsAmount}
          onChange={handleRewardsAmountChange}
          error={!!errorMessages.rewardsAmount}
          errorMessage={errorMessages.rewardsAmount}
        />
      </ResponsiveColumn>

      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.set.pool.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.set.pool.description" />
        </ThemedText.DeprecatedBody>
        <InputField
          placeholder="Pool Address"
          value={poolAddress}
          onChange={handlePoolAddressChange}
          error={!!errorMessages.poolAddress}
          errorMessage={errorMessages.poolAddress}
        />
      </ResponsiveColumn>

      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.set.incentives.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.set.incentives.description" />
        </ThemedText.DeprecatedBody>
        <CustomDiv>
          <DatePickerValue
            date={today}
            labelName="Start Date"
            onDateChange={setStartDate}
          />
          <TimePickerValue labelName="Start Time" onTimeChange={setStartTime} />
          <ThemedText.DeprecatedBody
            style={{
              alignItems: "center",
              display: "flex",
              fontWeight: 485,
              fontSize: 14,
              paddingLeft: 8,
            }}
          >
            <Trans>
              Starts on {formattedStartDate} at {startTime}
            </Trans>
          </ThemedText.DeprecatedBody>
        </CustomDiv>
        <CustomDiv>
          <DatePickerValue
            date={tomorrow}
            labelName="End Date"
            onDateChange={setEndDate}
          />
          <TimePickerValue labelName="End Time" onTimeChange={setEndTime} />
          <ThemedText.DeprecatedBody
            style={{
              alignItems: "center",
              display: "flex",
              fontWeight: 485,
              fontSize: 14,
              paddingLeft: 8,
            }}
          >
            <Trans>
              Ends on {formattedEndDate} at {endTime}
            </Trans>
          </ThemedText.DeprecatedBody>
        </CustomDiv>
        {errorMessages.date && (
          <CustomP color="red">
            <Trans i18nKey={errorMessages.date} />
          </CustomP>
        )}
      </ResponsiveColumn>

      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.set.vesting.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.set.vesting.description" />
        </ThemedText.DeprecatedBody>
        <InputField
          placeholder="Vesting period in days"
          value={vestingPeriod}
          onChange={handleVestingPeriodChange}
          error={!!errorMessages.vestingPeriod}
          errorMessage={errorMessages.vestingPeriod}
        />
      </ResponsiveColumn>

      <ResponsiveColumn>
        <HeaderText>
          <Trans i18nKey="common.create.incentives.enter.refundee.title" />
        </HeaderText>
        <ThemedText.DeprecatedBody
          style={{
            alignItems: "center",
            display: "flex",
            fontWeight: 485,
            fontSize: 14,
          }}
        >
          <Trans i18nKey="common.create.incentives.enter.refundee.description" />
        </ThemedText.DeprecatedBody>
        <InputField
          placeholder="Refundee address"
          value={refundeeAddress}
          onChange={handleRefundeeAddressChange}
          error={!!errorMessages.refundeeAddress}
          errorMessage={errorMessages.refundeeAddress}
        />
      </ResponsiveColumn>

      {!account.address ? (
        <ButtonLight
          onClick={accountDrawer.open}
          fontWeight={535}
          $borderRadius="16px"
          marginTop={2}
          marginBottom={3}
        >
          <Trans i18nKey="common.connectWallet.button" />
        </ButtonLight>
      ) : (
        <ButtonLight
          fontWeight={535}
          $borderRadius="16px"
          marginTop={2}
          marginBottom={3}
          onClick={createIncentive}
        >
          <Trans i18nKey="common.incentives.create.button" />
        </ButtonLight>
      )}
    </Flex>
  );
}
