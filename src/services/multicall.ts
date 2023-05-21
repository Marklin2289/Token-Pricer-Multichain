import { BytesLike, utils } from "ethers";
import { BaseService } from "./common";
import { IMulticall3, IMulticall3__factory } from "../../typechain-types";
import { ChainId } from "../constants";
import { Provider } from "../types";

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

interface Call3 {
  target: string;
  allowFailure: boolean;
  callData: BytesLike;
}

interface Result {
  success: boolean;
  returnData: BytesLike;
}

interface CallInput {
  target: string;
  encoder: () => string;
  decoder: (returnData: BytesLike) => utils.Result;
}

const getCallInputs = (
  targets: string[],
  contractInterface: utils.Interface,
  signatures: string[],
  args: any[] = []
) => {
  return targets.flatMap((target) => {
    return signatures.map(
      (signature, idx) =>
        ({
          target,
          encoder: () =>
            contractInterface.encodeFunctionData(
              signature,
              args.length > 1 ? args[idx] : args
            ),
          decoder: (returnData: BytesLike) =>
            contractInterface.decodeFunctionResult(signature, returnData),
        } as CallInput)
    );
  });
};

export class MulticallService extends BaseService<IMulticall3> {
  constructor(chainId: ChainId, provider?: Provider) {
    super(chainId, IMulticall3__factory, provider);
  }

  public getContract() {
    return this.contracts[MULTICALL3_ADDRESS];
  }

  public async call(
    targets: string[],
    contractInterface: utils.Interface,
    signatures: string[],
    args: any[] = [],
    allowFailure: boolean = true,
    displayTarget: boolean = false
  ) {
    const inputs = getCallInputs(targets, contractInterface, signatures, args);

    const calls = inputs.map(({ target, encoder }) => ({
      target,
      allowFailure,
      callData: encoder(),
    })) as Call3[];

    const multicall3 = this.getContract();

    const outputs: Result[] = await multicall3.callStatic.aggregate3(calls);

    return outputs.map(({ success, returnData }, idx) => {
      const target = inputs[idx].target;

      let result: any = null;

      if (!!success) {
        try {
          const decodedData = inputs[idx].decoder(returnData);
          result = decodedData.length > 1 ? decodedData : decodedData[0];
        } catch (error) {
          console.error(error);
        }
      }

      return !!displayTarget ? { target, result } : result;
    });
  }
}
