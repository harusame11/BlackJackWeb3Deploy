import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { mainnet, sepolia, avalancheFuji } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

//配置wagmi，设置chains，connectors，storage，ssr，transports
export function getConfig() {
  return createConfig({
    chains: [mainnet, sepolia, avalancheFuji],
    connectors: [
      //连接注入式钱包，例如MetaMask
      injected(),
      //连接coinbase钱包
      coinbaseWallet(),
    ],
    //使用cookie存储wagmi前端状态（持久化存储)
    storage: createStorage({
      storage: cookieStorage,
    }),
    //是否在服务器端渲染,提升加载前端速度
    ssr: true,
    //设置chains的transports，传输层设置
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [avalancheFuji.id]: http(),
    },
  })
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}