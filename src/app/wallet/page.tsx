'use client';
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@/components/ui";
import { Wallet, Copy } from "lucide-react";
import { BrowserProvider, formatEther } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useEIP6963 } from "@/hooks/use-eip6963";

export default function WalletPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const providers = useEIP6963();

  // If we're already connected, we might want to check connection status on mount, 
  // but for now we follow the manual connect flow.

  const connectWithProvider = async (providerDetail?: any) => {
    setLoading(true);
    try {
      // Use the passed provider, OR fallback to window.ethereum if strictly needed/assumed default
      const providerObject = providerDetail?.provider || (window as any).ethereum;

      if (!providerObject) {
        toast({
          variant: "destructive",
          title: "Wallet not found",
          description: "Please install a wallet extension like MetaMask.",
        });
        setLoading(false);
        return;
      }

      const provider = new BrowserProvider(providerObject);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const userBalance = await provider.getBalance(userAddress);

      setAddress(userAddress);
      setBalance(formatEther(userBalance));

    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Failed to connect to the wallet.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard.",
      });
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Wallet</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
            <div>
              <CardTitle>Your Web3 Wallet</CardTitle>
              <CardDescription>
                Connect and manage your wallet details.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {address ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Wallet Address</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm truncate bg-muted px-2 py-1 rounded-md">
                    {address}
                  </p>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Balance</h3>
                <p className="text-2xl font-bold mt-1">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'Loading...'}</p>
              </div>
              <Button onClick={() => connectWithProvider()} disabled={loading} className="w-full">
                {loading ? "Connecting..." : "Reconnect Wallet"}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              {providers.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground mb-2">Detected Wallets:</p>
                  {providers.map((p) => (
                    <Button
                      key={p.info.uuid}
                      onClick={() => connectWithProvider(p)}
                      disabled={loading}
                      variant="outline"
                      className="flex items-center gap-2 justify-start"
                    >
                      <img src={p.info.icon} alt={p.info.name} className="w-5 h-5" />
                      Connect with {p.info.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Connect your wallet to view your balance and sign transactions.
                  </p>
                  {/* Fallback button for legacy window.ethereum or empty list */}
                  <Button onClick={() => connectWithProvider()} disabled={loading}>
                    {loading ? "Connecting..." : "Connect Wallet"}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
