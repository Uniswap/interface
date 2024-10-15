// import { useCallback, useState } from "react";

// import { useWallet } from "contexts/wallet";
// import { useContracts } from "contexts/contracts";
// import { useNotifications } from "contexts/notifications";
// import { useData } from "contexts/data";

// const usePosition = (tokenId: number) => {
//   const { tx } = useNotifications();
//   const { address } = useWallet();
//   const { nftManagerPositionsContract, stakingRewardsContract } =
//     useContracts();
//   const { currentIncentive } = useData();

//   const [isWorking, setIsWorking] = useState<string | null>(null);

//   const approve = useCallback(
//     async (next: () => void) => {
//       if (
//         !(
//           nftManagerPositionsContract &&
//           stakingRewardsContract &&
//           currentIncentive
//         )
//       )
//         return;

//       try {
//         setIsWorking("Approving...");
//         await tx("Approving...", "Approved!", () =>
//           nftManagerPositionsContract.approve(
//             stakingRewardsContract.address,
//             tokenId
//           )
//         );
//         next();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsWorking(null);
//       }
//     },
//     [
//       tokenId,
//       currentIncentive,
//       stakingRewardsContract,
//       nftManagerPositionsContract,
//       tx,
//     ]
//   );

//   const transfer = useCallback(
//     async (next: () => void) => {
//       if (
//         !(
//           address &&
//           nftManagerPositionsContract &&
//           stakingRewardsContract &&
//           currentIncentive
//         )
//       )
//         return;

//       try {
//         setIsWorking("Transfering...");
//         await tx(
//           "Transfering...",
//           "Transfered!",
//           () =>
//             nftManagerPositionsContract[
//               "safeTransferFrom(address,address,uint256)"
//             ](address, stakingRewardsContract.address, tokenId) // https://stackoverflow.com/questions/68289806/no-safetransferfrom-function-in-ethers-js-contract-instance
//         );
//         next();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsWorking(null);
//       }
//     },
//     [
//       tokenId,
//       currentIncentive,
//       stakingRewardsContract,
//       nftManagerPositionsContract,
//       address,
//       tx,
//     ]
//   );

//   const stake = useCallback(
//     async (next: () => void) => {
//       if (!(stakingRewardsContract && currentIncentive)) return;

//       try {
//         setIsWorking("Staking...");
//         await tx("Staking...", "Staked!", () =>
//           stakingRewardsContract.stakeToken(currentIncentive.key, tokenId)
//         );
//         next();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsWorking(null);
//       }
//     },
//     [tokenId, currentIncentive, stakingRewardsContract, tx]
//   );

//   const unstake = useCallback(
//     async (next: () => void) => {
//       if (!(stakingRewardsContract && currentIncentive)) return;

//       try {
//         setIsWorking("Unstaking...");
//         await tx("Unstaking...", "Unstaked!", () =>
//           stakingRewardsContract.unstakeToken(currentIncentive.key, tokenId)
//         );
//         next();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsWorking(null);
//       }
//     },
//     [tokenId, currentIncentive, stakingRewardsContract, tx]
//   );

//   const claim = useCallback(
//     async (next: () => void) => {
//       if (!(stakingRewardsContract && currentIncentive && address)) return;

//       try {
//         setIsWorking("Claiming...");
//         const reward = await stakingRewardsContract.rewards(
//           currentIncentive.key.rewardToken,
//           address
//         );
//         await tx("Claiming...", "Claimed!", () =>
//           stakingRewardsContract.claimReward(
//             currentIncentive.key.rewardToken,
//             address,
//             reward
//           )
//         );
//         next();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsWorking(null);
//       }
//     },
//     [currentIncentive, address, stakingRewardsContract, tx]
//   );

//   const withdraw = useCallback(
//     async (next: () => void) => {
//       if (!(stakingRewardsContract && address)) return;

//       try {
//         setIsWorking("Withdrawing...");
//         await tx("Withdrawing...", "Withdrew!", () =>
//           stakingRewardsContract.withdrawToken(tokenId, address, [])
//         );
//         next();
//       } catch (e) {
//         console.warn(e);
//       } finally {
//         setIsWorking(null);
//       }
//     },
//     [tokenId, address, stakingRewardsContract, tx]
//   );

//   return { isWorking, approve, transfer, stake, unstake, claim, withdraw };
// };

// export default usePosition;
