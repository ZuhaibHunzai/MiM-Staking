import { ethers } from "ethers";
import { RPC_URLs, chains } from "./network-configs";

export const getContractInstance = (address, abi, signer) => {
  return new ethers.Contract(address, abi, signer);
};

export const getReadOnlyInstance = (address, abi) => {
  const rpcUrl = RPC_URLs[chains[0].id];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(address, abi, provider);
};
