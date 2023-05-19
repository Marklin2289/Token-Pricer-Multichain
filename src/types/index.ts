import { ChainId } from "../constants/networks";

export interface NetworkConfig {
  readonly chainId: ChainId;
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly logo: string;
  readonly platformId: string;
  readonly nativeId: string;
  readonly wrappedNativeId: string;
  readonly networkStatusUrl: string;
  readonly rpcUrl: { infura: string; alchemy?: string };
  readonly explorerUrl: string;
  readonly explorerApiUrl: string;
  readonly rddUrl: string;
  readonly blocksPerDay: number;
  readonly native: tokenModel;
  readonly wrappedNative: tokenModel;
}

export interface tokenModel {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}
