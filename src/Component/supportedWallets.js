import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAccount, useConnect } from "wagmi";
import "../styles/dialog.css";

export default function SupportedWallets({
  isOpen = false,
  onClose = () => null,
}) {
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) onClose();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Supported Wallets</Dialog.Title>

          <div className="wallet-container supported-wallets">
            {connectors.map(
              (connector) =>
                connector.ready && (
                  <div className="" key={connector.id}>
                    <button
                      className="connectors"
                      onClick={() => {
                        connect({ connector });
                        localStorage.setItem("wagmi-connector", connector.id);
                      }}
                    >
                      {connector.name}
                      {isLoading &&
                        connector.id === pendingConnector?.id &&
                        "(connecting)"}
                    </button>
                  </div>
                )
            )}
          </div>

          <button className="IconButton" aria-label="Close" onClick={onClose}>
            X
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
