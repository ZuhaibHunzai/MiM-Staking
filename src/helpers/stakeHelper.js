import { STACKING_ADDRESS, ERC20_ADDRESS } from "../assests/adresses";
import ABI_STAKING from "../assests/abi/stackingAbi.json";
import ERC20_ABI from "../assests/abi/erc20abi.json";
import {
  useAccount,
  useNetwork,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { getContract, parseEther } from "viem";

export const useStake = () => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { chain } = useNetwork();
  const { address } = useAccount();

  // const ERC20Instance = getContract({
  //   abi: ERC20_ABI,
  //   address: ERC20_ADDRESS,
  //   walletClient,
  // });

  const stackingInstance = getContract({
    abi: ABI_STAKING,
    address: STACKING_ADDRESS,
    walletClient,
  });

  const stake = async (stakeInput, autoCompound) => {
    try {
      const allowance = await publicClient.readContract({
        abi: ERC20_ABI,
        address: ERC20_ADDRESS,
        functionName: "allowance",
        args: [address, STACKING_ADDRESS],
      });

      console.log(allowance);
      if (allowance < stakeInput) {
        const hash = await walletClient.writeContract({
          abi: ERC20_ABI,
          address: ERC20_ADDRESS,
          functionName: "approve",
          args: [STACKING_ADDRESS, parseEther(stakeInput.toString())],
        });

        await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 2,
        });
      }

      const hash = await walletClient.writeContract({
        abi: ABI_STAKING,
        address: STACKING_ADDRESS,
        functionName: "StakeMiners",
        args: [parseEther(stakeInput.toString()), autoCompound],
      });
      console.log(parseEther(stakeInput), autoCompound, "inside");

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 3,
      });

      return;
    } catch (err) {
      console.log(err);
      throw (
        err.shortMessage || "An error occurred while executing the transaction"
      );
    }
  };

  const unstake = async (unstakeInput) => {
    try {
      const hash = await stackingInstance.write.UnstakeMiners(
        [parseEther(unstakeInput.toString())],
        {
          from: address,
          chain,
        }
      );
      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 3,
      });
    } catch (err) {
      throw (
        err.shortMessage || "An error occurred while executing the transaction"
      );
    }
  };

  const rebase = async () => {
    try {
      const hash = await stackingInstance.write.rebase({
        from: address,
        chain,
      });

      await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 2,
      });
    } catch (err) {
      throw (
        err.shortMessage || "An error occurred while executing the transaction"
      );
    }
  };
  return { stake, unstake, rebase };
};
