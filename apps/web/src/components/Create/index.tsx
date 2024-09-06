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
import { Flex } from "ui/src";
import { BigNumber, ethers } from "ethers";

import { useChainId } from "wagmi";
import { STAKER_ADDRESS, useV3StakerContract } from "hooks/useV3StakerContract";
import { useTokenContract } from "hooks/useContract";
import { useNavigate } from "react-router-dom";

dayjs.extend(utc);

export enum NetworkType {
  Type1 = "Taraxa/Taraswap",
  Type2 = "Coming soon",
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
  const navigate = useNavigate();
  const accountDrawer = useAccountDrawer();
  const today = dayjs().utc().format("YYYY-MM-DD");
  const tomorrow = dayjs().add(1, "day").utc().format("YYYY-MM-DD");

  const v3StakerContract = useV3StakerContract(true);

  const chainId = useChainId();

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

  const [shouldFetchAllowance, setShouldFetchAllowance] = useState(1);

  const [formData, setFormData] = useState({
    rewardTokenAddress: "",
    tokenSymbol: "",
    tokenDecimals: 18,
    rewardsAmount: "",
    vestingPeriod: "",
    poolAddress: "",
    refundeeAddress: "",
    approvalComplete: false,
    tokenAllowance: ethers.BigNumber.from(0),
  });

  const [isAproving, setIsAproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const updateFormData = (
    field: string,
    value: string | number | boolean | BigNumber
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [errorMessages, setErrorMessages] = useState({
    rewardToken: "",
    rewardsAmount: "",
    vestingPeriod: "",
    poolAddress: "",
    refundeeAddress: "",
    date: "",
  });

  const tokenContract = useTokenContract(formData.rewardTokenAddress);

  const approveToken = async (amount: BigNumber) => {
    if (tokenContract) {
      try {
        const tx = await tokenContract.approve(STAKER_ADDRESS, amount);
        await tx.wait();
        updateFormData("approvalComplete", true);
      } catch (error) {
        console.error(error);
        alert("Failed to approve token: " + error.message);
      }
    }
  };

  useEffect(() => {
    if (tokenContract) {
      Promise.all([tokenContract.symbol(), tokenContract.decimals()])
        .then(([symbol, decimals]) => {
          updateFormData("tokenSymbol", symbol);
          updateFormData("tokenDecimals", decimals);
        })
        .catch(console.error);
    }
  }, [tokenContract]);

  useEffect(() => {
    const requiredAmount = ethers.utils.parseUnits(
      formData.rewardsAmount || "0",
      formData.tokenDecimals
    );
    if (formData.tokenAllowance.gte(requiredAmount)) {
      updateFormData("approvalComplete", true);
    }
  }, [formData.tokenAllowance, formData.rewardsAmount, formData.tokenDecimals]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (tokenContract && account.address) {
        try {
          const allowance = await tokenContract.allowance(
            account.address,
            STAKER_ADDRESS
          );
          updateFormData("tokenAllowance", allowance);
          console.log("tokenAllowance", allowance);
        } catch (error) {
          console.error("Error fetching token allowance:", error);
        }
      }
    };
    fetchAllowance();
  }, [tokenContract, account.address, chainId, shouldFetchAllowance]);

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

  type InputChangeHandler = (
    field: keyof typeof formData,
    value: string | number | boolean | BigNumber
  ) => void;
  type ValidatorFunction = (value: string) => boolean;

  const handleInputChange: InputChangeHandler = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenericInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof formData,
    validator: ValidatorFunction,
    errorKey: keyof typeof errorMessages
  ) => {
    const value = event.target.value;
    handleInputChange(field, value);

    setErrorMessages((prev) => {
      if (value === "") {
        return {
          ...prev,
          [errorKey]: `The ${field} is required.`,
        };
      } else {
        return {
          ...prev,
          [errorKey]: validator(value)
            ? ""
            : `common.create.incentives.set.token.notValid.${field}`,
        };
      }
    });
  };

  const handleRewardTokenAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    handleGenericInputChange(
      e,
      "rewardTokenAddress",
      isValidEthereumAddress,
      "rewardToken"
    );

  const handlePoolAddressChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleGenericInputChange(
      e,
      "poolAddress",
      isValidEthereumAddress,
      "poolAddress"
    );

  const handleRefundeeAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) =>
    handleGenericInputChange(
      e,
      "refundeeAddress",
      isValidEthereumAddress,
      "refundeeAddress"
    );

  const handleRewardsAmountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleGenericInputChange(
      e,
      "rewardsAmount",
      (value) => /^\d*\.?\d*$/.test(value),
      "rewardsAmount"
    );

  const handleVestingPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    handleGenericInputChange(
      e,
      "vestingPeriod",
      (value) => /^\d+$/.test(value),
      "vestingPeriod"
    );

  const createIncentive = async () => {
    if (!formData.rewardTokenAddress)
      setErrorMessages((prev) => ({
        ...prev,
        rewardToken: "The reward token address is required.",
      }));
    if (!formData.rewardsAmount)
      setErrorMessages((prev) => ({
        ...prev,
        rewardsAmount: "The reward amount is required.",
      }));
    if (!formData.poolAddress)
      setErrorMessages((prev) => ({
        ...prev,
        poolAddress: "The pool address is required.",
      }));
    if (!formData.vestingPeriod)
      setErrorMessages((prev) => ({
        ...prev,
        vestingPeriod: "The vesting period is required.",
      }));
    if (!formData.refundeeAddress)
      setErrorMessages((prev) => ({
        ...prev,
        refundeeAddress: "The refundee address is required.",
      }));

    if (
      formData.rewardTokenAddress &&
      formData.rewardsAmount &&
      formData.poolAddress &&
      formData.vestingPeriod &&
      formData.refundeeAddress
    ) {
      try {
        const startedTime = Math.floor(
          new Date(`${startDate} ${startTime}`).getTime() / 1000
        );
        const endedTime = Math.floor(
          new Date(`${endDate} ${endTime}`).getTime() / 1000
        );
        const reward = ethers.utils.parseUnits(
          formData.rewardsAmount,
          formData.tokenDecimals
        );
        const incentiveKey = {
          rewardToken: formData.rewardTokenAddress,
          pool: formData.poolAddress,
          startTime: startedTime,
          endTime: endedTime,
          vestingPeriod: formData.vestingPeriod,
          refundee: formData.refundeeAddress,
        };

        if (v3StakerContract) {
          setIsCreating(true);
          const tx = await v3StakerContract.createIncentive(
            incentiveKey,
            reward
          );
          await tx.wait();

          setIsCreating(false);
          // Reset form data
          setFormData({
            rewardTokenAddress: "",
            tokenSymbol: "",
            tokenDecimals: 18,
            rewardsAmount: "",
            vestingPeriod: "",
            poolAddress: "",
            refundeeAddress: "",
            approvalComplete: false,
            tokenAllowance: ethers.BigNumber.from(0),
          })
          navigate({
            pathname: "/farms",
          });
        } else {
          alert("Contract is not available.");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to create incentive: " + error.message);
        setIsCreating(false);
      }
    }
  };

  const approve = async () => {
    setIsAproving(true);
    approveToken(
      ethers.utils.parseUnits(
        formData.rewardsAmount || "0",
        formData.tokenDecimals
      )
    )
      .then(() => {
        setShouldFetchAllowance((prev) => prev + 1);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsAproving(false);
      });
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
        <NetworkTypeMenu networkType={NetworkType.Type1} />
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
          value={formData.rewardTokenAddress}
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
          value={formData.rewardsAmount}
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
          value={formData.poolAddress}
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
          value={formData.vestingPeriod}
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
          value={formData.refundeeAddress}
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
      ) : formData.tokenAllowance &&
        formData.tokenAllowance.gte(
          ethers.utils.parseUnits(
            formData.rewardsAmount || "0",
            formData.tokenDecimals
          )
        ) ? (
        <ButtonLight
          fontWeight={535}
          $borderRadius="16px"
          marginTop={2}
          marginBottom={3}
          onClick={createIncentive}
          disabled={
            !formData.approvalComplete ||
            !formData.rewardTokenAddress ||
            isCreating
          }
        >
          {isCreating ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              style={{ marginRight: "8px" }}
            >
              <path
                fill="currentColor"
                d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
              >
                <animateTransform
                  attributeName="transform"
                  dur="0.75s"
                  repeatCount="indefinite"
                  type="rotate"
                  values="0 12 12;360 12 12"
                />
              </path>
            </svg>
          ) : (
            <Trans i18nKey="common.incentives.create.button" />
          )}
        </ButtonLight>
      ) : (
        <ButtonLight
          fontWeight={535}
          $borderRadius="16px"
          marginTop={2}
          marginBottom={3}
          onClick={approve}
          disabled={isAproving}
        >
          {isAproving ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              style={{ marginRight: "8px" }}
            >
              <path
                fill="currentColor"
                d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
              >
                <animateTransform
                  attributeName="transform"
                  dur="0.75s"
                  repeatCount="indefinite"
                  type="rotate"
                  values="0 12 12;360 12 12"
                />
              </path>
            </svg>
          ) : (
            <Trans
              i18nKey="common.incentives.approve.button"
              values={{ tokenSymbol: formData.tokenSymbol }}
            />
          )}
        </ButtonLight>
      )}
    </Flex>
  );
}
