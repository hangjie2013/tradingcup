import { http } from 'wagmi'
import { mainnet, polygon, bsc } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Use a placeholder during build if env var is not set
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-project-id'

export const wagmiConfig = getDefaultConfig({
  appName: 'TradingCup',
  projectId,
  chains: [mainnet, polygon, bsc],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
  ssr: true,
})
