'use client'
//这个文件是一个全局提供者组件，负责为整个应用提供各种服务和上下文。主要功能如下：
//1. 使用WagmiProvider提供Wagmi的上下文，管理区块链连接状态
//2. 使用QueryClientProvider提供React Query的上下文，管理数据查询状态
//3. 使用RainbowKitProvider提供RainbowKit的上下文，管理钱包连接和交互

import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'

import { getConfig } from '@/wagmi'

export function Providers(props: {
  children: ReactNode
  initialState?: State
}) {
  const [config] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {props.children}      
          </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}