export const STACKING_ADDRESS = "0xb12329B07896E6966D0464133390EF7eF95138c4";
export const ERC20_ADDRESS = "0xe3Da8fb40ca5df4868B36796031B45c6F65F0bdb";

// import {
//     useAccount,
//     useNetwork,
//     usePublicClient,
//     useWalletClient,
//   } from "wagmi";
//   import { getContract, parseEther } from "viem";
//   import {
//     CANARY_DAO_ABI,
//     DAO_CONTRACT_ADDRESS,
//     ERC20_ABI,
//     ERC20_CONTRACT_ADDRESS,
//   } from "@/src/lib/constants";
//   import { useBalances } from "./useBalances";
//   import { useRebase } from "../context";

//   export const useStake = () => {
//     const { data: walletClient } = useWalletClient();
//     const publicClient = usePublicClient();
//     const { chain } = useNetwork();
//     const { address } = useAccount();
//     const { balance, getBalances } = useBalances();
//     const { getRebaseInfo } = useRebase();

//     const canyContractWrite = getContract({
//       abi: CANARY_DAO_ABI,
//       address: DAO_CONTRACT_ADDRESS,
//       walletClient,
//     });
//     const tokenContractWrite = getContract({
//       abi: ERC20_ABI,
//       address: ERC20_CONTRACT_ADDRESS,
//       walletClient,
//     });

//     const onStakeCanary = async (stakeInput) => {
//       try {
//         const allowance = await publicClient.readContract({
//           abi: ERC20_ABI,
//           address: ERC20_CONTRACT_ADDRESS,

//           functionName: "allowance",
//           args: [address, DAO_CONTRACT_ADDRESS],
//         });

//         if (allowance < stakeInput) {
//           const hash = await tokenContractWrite.write.approve(
//             [DAO_CONTRACT_ADDRESS, parseEther(balance)],
//             {
//               from: address,
//               chain,
//             }
//           );

//           await publicClient.waitForTransactionReceipt({
//             hash,
//             confirmations: 2,
//           });
//         }

//         const hash = await canyContractWrite.write.stakeCNYA(
//           [parseEther(stakeInput.toString())],
//           {
//             from: address,
//             chain,
//           }
//         );

//         await publicClient.waitForTransactionReceipt({
//           hash,
//           confirmations: 3,
//         });

//         getBalances(address);
//         return;
//       } catch (err) {
//         throw (
//           err.shortMessage || "An error occurred while executing the transaction"
//         );
//       }
//     };

//     const onUnstakeCanary = async (unstakeInput) => {
//       try {
//         const hash = await canyContractWrite.write.unstakeCNYA(
//           [parseEther(unstakeInput.toString())],
//           {
//             from: address,
//             chain,
//           }
//         );
//         await publicClient.waitForTransactionReceipt({
//           hash,
//           confirmations: 3,
//         });

//         getBalances(address);
//       } catch (err) {
//         throw (
//           err.shortMessage || "An error occurred while executing the transaction"
//         );
//       }
//     };

//     const onRebase = async () => {
//       try {
//         const hash = await canyContractWrite.write.rebase({
//           from: address,
//           chain,
//         });

//         await publicClient.waitForTransactionReceipt({
//           hash,
//           confirmations: 2,
//         });

//         getBalances(address);
//         getRebaseInfo();
//       } catch (err) {
//         throw (
//           err.shortMessage || "An error occurred while executing the transaction"
//         );
//       }
//     };
//     return { onStakeCanary, onUnstakeCanary, onRebase };
//   };

// ** states
// const [totalValueLocked, setTotalValueLocked] = useState("0");
// const [totalWeeklyAwards, setTotalWeeklyAwards] = useState("0");
// const [totalMinerRewads, setTotalMinerAwards] = useState("0");
// const [APY, setAPY] = useState("0");
// const [lockPeriod, setLockPeriod] = useState("0");
// const [myWeeklyRewards, setMyWeeklyRewards] = useState("0");

// let a;
// ** functions to read values from contract
// useEffect(() => {
//   const getTotalValueLocked = async () => {
//     if (a) {
//       try {
//         const contractInstance = a;
//         const valueLocked = await contractInstance.LockPeriod();
//         setTotalValueLocked(valueLocked);
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   };
//   const getRotalWeeklyAwards = async () => {
//     if (a) {
//       try {
//         const contractInstance = a;
//         const weeklyRewards = await contractInstance.weeklyRewards();
//         setTotalWeeklyAwards(weeklyRewards);
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   };

//   const getTotalMinerRewads = async () => {
//     if (a) {
//       try {
//         const contractInstance = a;
//         const minerRewards = await contractInstance.totalMinerRewards();
//         setTotalMinerAwards(minerRewards);
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   };

//   const getAPY = async () => {
//     if (a) {
//       try {
//         const contractInstance = a;
//         const apy = await contractInstance.APY();
//         setAPY(apy);
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   };

//   const getlockPeriod = async () => {
//     if (a) {
//       try {
//         const contractInstance = a;
//         const lockPeriod = await contractInstance.APY();
//         setLockPeriod(lockPeriod);
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   };

//   const getmyWeeklyRewards = async () => {
//     if (a) {
//       try {
//         const contractInstance = a;
//         const weeklyRewards = await contractInstance.APY();
//         setMyWeeklyRewards(weeklyRewards);
//       } catch (err) {
//         console.log(err);
//       }
//     }
//   };

//   if (a) {
//     getTotalValueLocked();
//     getRotalWeeklyAwards();
//     getTotalMinerRewads();
//     getAPY();
//     getlockPeriod();
//     getmyWeeklyRewards();
//   }
// }, [a]);

// const buyTokens = async (event) => {
//   event.preventDefault();
//   try {
//     const data = new FormData(event.target);
//     const buy = data.get("buy");
//     if (buy && signer) {
//       const contractInstance = new ethers.Contract(
//         contractAddress,
//         abi,
//         signer
//       );
//       const tx = await contractInstance.buyTokens({
//         value: ethers.utils.parseEther(String(buy)),
//       });

//       await tx.wait();
//       // Transaction successful
//       alert("Tokens bought successfully!");
//     } else {
//       alert("Buy value is null or empty");
//     }
//   } catch (err) {
//     const errorMessage =
//       "Error occurred during token purchase. Please try again later.\n\n" +
//       err.message;
//     alert(errorMessage);
//     console.log(err);
//   }
// };
