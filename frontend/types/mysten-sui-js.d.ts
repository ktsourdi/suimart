declare module "@mysten/sui.js/transactions" {
  export class TransactionBlock {
    constructor(): void;
    gas: any;
    splitCoins(coin: any, amounts: any[]): any;
    pure(value: any): any;
    object(id: string): any;
    moveCall(params: {
      target: string;
      typeArguments?: string[];
      arguments: any[];
    }): void;
    makeMoveVec(types: string[] | null, objects: any[]): any;
    setGasBudget(budget: number): void;
    setSender(address: string): void;
    /** Serialize to bytes */
    build(options?: { maxSizeBytes?: number }): Promise<Uint8Array>;
  }
}

declare module "@mysten/sui.js" {
  export interface QueryEventsParams {
    MoveEventType: string;
  }

  export interface JsonRpcProviderOptions {
    url?: string;
  }

  export class JsonRpcProvider {
    constructor(urlOrOptions: string | JsonRpcProviderOptions);
    queryEvents(params: QueryEventsParams): Promise<{ data: any[] }>;
    getObject(params: {
      id: string;
      options?: { showType?: boolean };
    }): Promise<{ data: { type: string } }>;
  }
}