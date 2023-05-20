import { ChainId } from "../../constants";
import { TokenModel } from "../../types";

import mainnet from "./mainnet.json";
import optimism from "./optimism.json";
import bsc from "./bsc.json";
import polygon from "./polygon.json";
import arbitrum from "./arbitrum.json";
import avalanche from "./avalanche.json";
import { isAddress, isSameAddress } from "../../utils";

// define TOKEN_LIST mapping with chainId
const TOKEN_LIST: { [chainId in ChainId]: TokenModel[] } = {
  [ChainId.MAINNET]: JSON.parse(JSON.stringify(mainnet, null, 4)),
  [ChainId.OPTIMISM]: JSON.parse(JSON.stringify(optimism, null, 4)),
  [ChainId.BSC]: JSON.parse(JSON.stringify(bsc, null, 4)),
  [ChainId.POLYGON]: JSON.parse(JSON.stringify(polygon, null, 4)),
  [ChainId.ARBITRUM]: JSON.parse(JSON.stringify(arbitrum, null, 4)),
  [ChainId.AVALANCHE]: JSON.parse(JSON.stringify(avalanche, null, 4)),
};

export const getTokens = (chainId: ChainId, targets: string[] = []) => {
  //get single tokenList from TOKEN_LIST mapping with chainId
  const tokenList = TOKEN_LIST[chainId];

  // if targets = empty, [N/A], return tokenList, no filtering
  if (targets.length === 0) {
    return tokenList;
  }

  // if targets = [target1, target2], e.g([`1inch`, `USD`])
  return targets.reduce<TokenModel[]>((acc, target) => {
    // console.log("isAddress() called, return : ", isAddress(target)); => false
    // define token from tokenList.find()
    const token = tokenList.find((token) =>
      // if target = address, return isSameAddress(target, token.address)

      !!isAddress(target) // target = string[] => [address/symbol, symbol, address]
        ? isSameAddress(target, token.address)
        : target.toUpperCase() === token.symbol.toUpperCase()
    );
    if (!!token) {
      acc.push(token);
    } else {
      console.log(`${target} not found in token list`);
    }
    return acc;
  }, []);
};

// define getToken() , get single token from getTokens()
export const getToken = (chainId: ChainId, target: string) => {
  const [token] = getTokens(chainId, [target]);

  if (!!token) {
    throw new Error(`${target} not found in token list`);
  }

  return token;
};

/**
 * todo: Question: ETH AND BTC NOT FOUND IN TOKEN LIST ??? why ???
 * console.log(getTokens(1, [`0x111111111117dC0aa78b770fA6A738034120C302`, `BTC`]));
 * BTC not found in token list
[
  {
    chainId: 1,
    address: '0x111111111117dC0aa78b770fA6A738034120C302',
    name: '1inch',
    symbol: '1INCH',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/13469/thumb/1inch-token.png?1608803028'
  }
]
 */
