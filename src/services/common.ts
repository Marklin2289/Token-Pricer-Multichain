import { Contract, Signer, utils } from "ethers";
import { NetworkConfig, Provider } from "../types";
import { ChainId, getNetwork } from "../constants";
import { JsonRpcProvider } from "@ethersproject/providers";
import { getRpcUrl } from "../config";
import { getAddress } from "../utils";

// define interface ContractFactory
export interface ContractFactory {
  // inside connect function we will use ethers.Contract
  connect: (address: string, signerOrProvider: Signer | Provider) => Contract;
  // inside createInterface function we will use ethers.utils.Interface
  createInterface: () => utils.Interface;
}

// export class Contract extends BaseContract {
// The meta-class properties
//     readonly [ key: string ]: ContractFunction | any;
// }
export abstract class BaseService<T extends Contract> {
  public readonly chainId: ChainId;
  public readonly network: NetworkConfig;
  public readonly provider: Provider;
  public readonly contractFactory: ContractFactory;
  public readonly contracts: { [address: string]: T };

  constructor(
    chainId: ChainId,
    contractFactory: ContractFactory,
    provider?: Provider
  ) {
    this.chainId = chainId;
    this.network = getNetwork(chainId);
    this.provider = !!provider
      ? provider
      : new JsonRpcProvider(getRpcUrl(chainId));
    this.contractFactory = contractFactory;
    this.contracts = {};
  }

  // getContract function
  public getContract(address: string) {
    const contractAddress = getAddress(address);

    if (!this.contracts[contractAddress]) {
      this.contracts[contractAddress] = this.contractFactory.connect(
        contractAddress,
        this.provider
      ) as T;
    }
    return this.contracts[contractAddress];
  }

  // getInterface function
  public getInterface() {
    return this.contractFactory.createInterface();
  }
}
