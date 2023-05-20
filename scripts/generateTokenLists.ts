import * as fs from "fs";
import * as path from "path";
import axios from "axios";

import { ChainId, getNetwork } from "../src/constants";
import { TokenModel } from "../src/types";

interface TokenModelExtended extends TokenModel {
  extensions?: any;
}

interface TokenListModel {
  name: string;
  timestamp: string;
  version: { major: number; minor: number; patch: 0 };
  tags?: any;
  logoURI: string;
  keywords: string[];
  tokens: TokenModelExtended[];
}

const UNISWAP_LIST =
  "https://gateway.pinata.cloud/ipfs/QmaQvV3pWKKaWJcHvSBuvQMrpckV3KKtGJ6p3HZjakwFtX";
const SUSHI_LIST = "https://token-list.sushi.com/";
const OPTIMISM_LIST = "https://static.optimism.io/optimism.tokenlist.json";
const ARBITRUM_LIST = "https://bridge.arbitrum.io/token-list-42161.json";

const TOKEN_LIST_URLS = [
  UNISWAP_LIST,
  SUSHI_LIST,
  OPTIMISM_LIST,
  ARBITRUM_LIST,
];

const isValidChainId = (chainId: number) => {
  return Object.values(ChainId)
    .filter((id) => !isNaN(+id))
    .includes(chainId);
};

const request = async (url: string) => {
  try {
    const response = await axios.get<TokenListModel>(url, {
      headers: {
        Accept: "application/json, text/plain",
      },
    });
    // console.log(response.data);
    return response.data;
  } catch (e) {
    console.error(`Failed to fetch token list from ${url}`);
    console.error(e);
  }
};

const main = async () => {
  // const response = await axios.get<TokenListModel>(UNISWAP_LIST, {
  // 	headers: {
  // 		"Accept": "application/json, text/plain"
  // 	}
  // })

  const cached: Set<string> = new Set();

  let tokenLists: { [id in ChainId]: TokenModelExtended[] } = {
    [ChainId.MAINNET]: [],
    [ChainId.OPTIMISM]: [],
    [ChainId.BSC]: [],
    [ChainId.POLYGON]: [],
    [ChainId.ARBITRUM]: [],
    [ChainId.AVALANCHE]: [],
  };

  for (const url of TOKEN_LIST_URLS) {
    const response = await request(url);

    if (!response) continue;

    tokenLists = response.tokens.reduce<{
      [id in ChainId]: TokenModelExtended[];
    }>((acc, token) => {
      const tokenKey = `${token.chainId}-${token.address}`;

      if (!!isValidChainId(token.chainId) && !cached.has(tokenKey)) {
        if (!!token.extensions) delete token.extensions;

        acc[token.chainId as ChainId].push(token);
        cached.add(tokenKey);
      }

      return acc;
    }, tokenLists);
  }

  Object.entries(tokenLists).map(([chainId, tokenList]) => {
    const network = getNetwork(+chainId);

    const filePath = path.join(
      __dirname,
      "../src/schema/tokens",
      `${network.name}.json`
    );

    fs.writeFileSync(filePath, JSON.stringify(tokenList, null, 4));
  });
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
