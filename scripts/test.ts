// import { TokenService } from "./../src/services/tokens";
// import { getFeed, getFeeds } from "../src/schema/feeds";

import { TokenService } from "../src/services/tokens";
import { isAddress } from "../src/utils";

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
