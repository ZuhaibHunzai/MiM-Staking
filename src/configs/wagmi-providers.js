import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { createPublicClient, http } from "viem";
import { WagmiConfig, createConfig, mainnet } from "wagmi";
import { goerli } from "wagmi/chains";

export const chains = [goerli];
const projectId = "7e778a0cc9adc4e4434bf73bff51f07c";

const publicClient = createPublicClient({
  chain: goerli,
  transport: http(chains[0].rpcUrls[0]),
});

export const config = createConfig({
  autoConnect: true,
  publicClient,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        version: "2",
        projectId,
        infuraId: "c85091b5313b43a2ad33394601143de7", // update infura key
        chainId: chains[0].id,
      },
    }),
  ],
});

export const WagmiProviderWrapper = ({ children }) => {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
};
