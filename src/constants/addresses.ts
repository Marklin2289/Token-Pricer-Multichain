import { ChainId } from "./networks";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const BTC_QUOTE = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";
export const USD_QUOTE = "0x0000000000000000000000000000000000000348";

// mapping type :
export const WETH_ADDRESS: { [id in ChainId]: string } = {
  [ChainId.MAINNET]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  [ChainId.OPTIMISM]: "0x4200000000000000000000000000000000000006",
  [ChainId.BSC]: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  [ChainId.POLYGON]: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  [ChainId.ARBITRUM]: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  [ChainId.AVALANCHE]: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
};

const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";

export const WRAPPED_NATIVE: { [id in ChainId]: string } = {
  [ChainId.MAINNET]: WETH_ADDRESS[ChainId.MAINNET],
  [ChainId.OPTIMISM]: WETH_ADDRESS[ChainId.OPTIMISM],
  [ChainId.BSC]: WBNB_ADDRESS,
  [ChainId.POLYGON]: WMATIC_ADDRESS,
  [ChainId.ARBITRUM]: WETH_ADDRESS[ChainId.ARBITRUM],
  [ChainId.AVALANCHE]: WAVAX_ADDRESS,
};
