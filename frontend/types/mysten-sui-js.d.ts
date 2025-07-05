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
  }
}