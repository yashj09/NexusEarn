import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  scroll,
  avalanche,
  sophon,
  kaia,
  sepolia,
  baseSepolia,
  arbitrumSepolia,
  optimismSepolia,
  polygonAmoy,
} from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const isClient = typeof window !== "undefined";

export const config = createConfig({
  chains: [
    mainnet,
    base,
    polygon,
    arbitrum,
    optimism,
    scroll,
    avalanche,
    sophon,
    kaia,
    sepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
    polygonAmoy,
  ],
  transports: {
    [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
    [arbitrum.id]: http(arbitrum.rpcUrls.default.http[0]),
    [base.id]: http(base.rpcUrls.default.http[0]),
    [optimism.id]: http(optimism.rpcUrls.default.http[0]),
    [polygon.id]: http(polygon.rpcUrls.default.http[0]),
    [avalanche.id]: http(avalanche.rpcUrls.default.http[0]),
    [scroll.id]: http(scroll.rpcUrls.default.http[0]),
    [sophon.id]: http(sophon.rpcUrls.default.http[0]),
    [kaia.id]: http(kaia.rpcUrls.default.http[0]),
    [sepolia.id]: http(sepolia.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
    [arbitrumSepolia.id]: http(arbitrumSepolia.rpcUrls.default.http[0]),
    [optimismSepolia.id]: http(optimismSepolia.rpcUrls.default.http[0]),
    [polygonAmoy.id]: http(polygonAmoy.rpcUrls.default.http[0]),
  },
  connectors: isClient
    ? [
        injected({ shimDisconnect: true }),
        ...(walletConnectProjectId
          ? [walletConnect({ projectId: walletConnectProjectId })]
          : []),
      ]
    : [],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});
