import * as t from "io-ts/lib/index.js";
declare const configGuard: t.TypeC<{
    blockfrostProjectId: t.StringC;
    blockfrostUrl: t.StringC;
    network: t.UnionC<[t.LiteralC<"Mainnet">, t.LiteralC<"Preview">, t.LiteralC<"Preprod">, t.LiteralC<"Custom">]>;
    seedPhraseNami: t.StringC;
    seedPhraseLace: t.StringC;
    runtimeURL: t.StringC;
}>;
export type Config = t.TypeOf<typeof configGuard>;
export declare function readConfig(): Promise<Config>;
export {};
//# sourceMappingURL=config.d.ts.map