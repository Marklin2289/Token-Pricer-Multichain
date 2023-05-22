// import { TokenService } from "./../src/services/tokens";
// import { getFeed, getFeeds } from "../src/schema/feeds";

import { ChainId } from "../src";
import { V2PairPricerService } from "../src/services";

// import { TokenService } from "../src/services/tokens";
// import { isAddress } from "../src/utils";

// import { getTokens } from "../src/schema/tokens";

// console.log("getFeeds() called return :");
// console.log(getFeeds(1, [[`ETH`, `USD`]]));

// console.log("getFeed() called return : ", getFeed(1, `ETH`, `USD`));

// console.log(
//   getTokens(1, [`0x111111111117dC0aa78b770fA6A738034120C302`, `BTC`])
// );

// const getTokenInfo = async (token: string) => {
//   const tokenService = new TokenService(1);
//   // const tokenTicker = !!isAddress(token)
//   //   ? (await tokenService.getToken(token)).symbol?.toUpperCase()
//   //   : token.toUpperCase();

//   const tokenInfo = await tokenService.getToken(token);
//   return tokenInfo;
// };
// const response = getTokenInfo(`0x111111111117dC0aa78b770fA6A738034120C302`)
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
// console.log(response);

// const testingMulticall = async (tokenAddresses: string[]) => {
//   const tokenService = new TokenService(1);
//   const response = await tokenService.fetchTokens(tokenAddresses);
//   return response;
// };
// const response = testingMulticall([`1inch, 1INCH, 18`])
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.log(err);
//   });
// console.log(response);

// public async getPairState(protocol: string, tokenA: string, tokenB: string)

const getPairPricerService = async (
  chainId: ChainId,
  protocol: string,
  tokenA: string,
  tokenB: string
) => {
  const pairPricerService = new V2PairPricerService(chainId);
  const response = await pairPricerService
    .getPairState(protocol, tokenA, tokenB) // can be addresses or symbols
    .then((res) => {
      return {
        protocol: res.protocol,
        pair: res.pair,
        token0: res.token0,
        token1: res.token1,
        liquidity: res.liquidity,
        reserve0: res.reserve0,
        reserve1: res.reserve1,
        blockTimestampLast: res.blockTimestampLast,
      };
    })
    .catch((err) => {
      console.log(err);
    });
  console.log(response);
  return response;
};
getPairPricerService(1, "sushi-swap", "1inch", "dai");
