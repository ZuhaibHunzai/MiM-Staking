import { useState } from "react";
import Logo from "../mim.png";
import SupportedWallets from "./supportedWallets";
import { useAccount, useDisconnect } from "wagmi";

export const Header = () => {
  const [isConnectModal, setIsConnectModal] = useState(false);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const shortenAddress = address
    ? `${address?.slice(0, 4)}...${address?.slice(-5)}`
    : null;

  const onConnect = () => {
    if (isConnected) disconnect();
    else {
      setIsConnectModal(true);
    }
  };

  return (
    <>
      <SupportedWallets
        isOpen={isConnectModal}
        onClose={() => setIsConnectModal(false)}
      />
      <header className="Header_Container">
        <div className="Header_logo">
          <img src={Logo} alt="no images" />
        </div>

        <button onClick={onConnect} className="Header_wallet">
          {shortenAddress || "Connect Wallet"}
        </button>
      </header>
    </>
  );
};
