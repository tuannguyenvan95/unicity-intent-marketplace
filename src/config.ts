export const UNICITY_CONFIG = {
  network: "testnet" as const,
  networkId: 4,
  oracle: {
    url: "https://gateway.testnet2.unicity.network",
    apiKey: "sk_ddc3cfcc001e4a28ac3fad7407f99590",
  },
  walletApi: {
    baseUrl: "https://wallet-api.unicity.network",
    network: "testnet2" as const,
  },
  nostr: {
    relays: ["wss://nostr-relay.testnet.unicity.network"],
  },
  tokens: {
    UCT: {
      symbol: "UCT",
      name: "Unicity Test Token",
      decimals: 6,
      // Fallback UCT coin ID if dynamic resolution is not available
      coinId: "0x0000000000000000000000000000000000000000000000000000000000000001",
    },
    STORAGE: {
      symbol: "STORAGE",
      name: "Unicity Storage Token (1GB/token)",
      decimals: 6,
      // Fallback STORAGE coin ID
      coinId: "0x0000000000000000000000000000000000000000000000000000000000000002",
    }
  }
};
