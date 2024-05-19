import * as M from "fp-ts/lib/Map.js";
import { bundleMapToList, isAnnotated, stripAnnotations } from "@marlowe.io/marlowe-object";
import { getContractClosure } from "./contract-closure.js";
import * as CoreG from "@marlowe.io/language-core-v1/guards";
import * as ObjG from "@marlowe.io/marlowe-object/guards";
import { emptyState, playSingleInputTxTrace, } from "@marlowe.io/language-core-v1/semantics";
import { deepEqual } from "@marlowe.io/adapter/deep-equal";
function annotateInputFromClosure(contractClosure) {
    return function (input) {
        if (input === "input_notify")
            return "input_notify";
        if ("merkleized_continuation" in input) {
            const annotatedContinuation = contractClosure.contracts.get(input.continuation_hash);
            if (typeof annotatedContinuation === "undefined")
                throw new Error(`Cant find continuation for ${input.continuation_hash}`);
            return { ...input, merkleized_continuation: annotatedContinuation };
        }
        else {
            return input;
        }
    };
}
function annotateHistoryFromClosure(contractClosure) {
    return function (history) {
        return history.map((tx) => {
            if (typeof tx.input === "undefined") {
                return tx;
            }
            else {
                return {
                    ...tx,
                    input: annotateInputFromClosure(contractClosure)(tx.input),
                };
            }
        });
    };
}
async function annotatedClosure(restClient, sourceObjectMap) {
    const { contractSourceId, intermediateIds } = await restClient.createContractSources({
        bundle: bundleMapToList(sourceObjectMap),
    });
    const closure = await getContractClosure({ restClient })(contractSourceId);
    // The intermediateIds is an object whose keys belong to the source code and value is the merkle hash.
    // We need to reverse this object in order to annotate the closure using the source annotations.
    // It is possible for two different source entries to have the same hash and different annotations.
    // In that case the last annotation will prevail.
    const sourceMap = Object.fromEntries(Object.entries(intermediateIds).map(([source, hash]) => [hash, source]));
    function getSourceContract(ref) {
        const sourceContractObject = sourceObjectMap.objects[ref];
        if (typeof sourceContractObject === "undefined")
            throw new Error(`Cant find source for ${ref}`);
        return sourceContractObject.value;
    }
    function copyAnnotation(source, dst) {
        if (isAnnotated(source)) {
            return { annotation: source.annotation, ...dst };
        }
        return dst;
    }
    function annotateContract(source, dst) {
        let srcContract = source;
        if (ObjG.Reference.is(source)) {
            srcContract = getSourceContract(source.ref);
        }
        if (CoreG.Close.is(dst) && ObjG.Close.is(srcContract)) {
            return srcContract;
        }
        if (CoreG.Pay.is(dst) && ObjG.Pay.is(srcContract)) {
            return copyAnnotation(srcContract, {
                ...dst,
                then: annotateContract(srcContract.then, dst.then),
            });
        }
        if (CoreG.If.is(dst) && ObjG.If.is(srcContract)) {
            return copyAnnotation(srcContract, {
                ...dst,
                then: annotateContract(srcContract.then, dst.then),
                else: annotateContract(srcContract.else, dst.else),
            });
        }
        if (CoreG.Let.is(dst) && ObjG.Let.is(srcContract)) {
            return copyAnnotation(srcContract, {
                ...dst,
                then: annotateContract(srcContract.then, dst.then),
            });
        }
        if (CoreG.Assert.is(dst) && ObjG.Assert.is(srcContract)) {
            return copyAnnotation(srcContract, {
                ...dst,
                then: annotateContract(srcContract.then, dst.then),
            });
        }
        if (CoreG.When.is(dst) && ObjG.When.is(srcContract)) {
            const srcWhen = srcContract;
            return copyAnnotation(srcWhen, {
                ...dst,
                timeout_continuation: annotateContract(srcWhen.timeout_continuation, dst.timeout_continuation),
                when: dst.when.map((dstCase, index) => {
                    const srcCase = srcWhen.when[index];
                    if ("merkleized_then" in srcCase) {
                        throw new Error(`Merkleized not supported in source.`);
                    }
                    if ("then" in srcCase && "then" in dstCase) {
                        return {
                            ...dstCase,
                            then: annotateContract(srcCase.then, dstCase.then),
                        };
                    }
                    else {
                        return dstCase;
                    }
                }),
            });
        }
        throw new Error(`Cant annotate source contract.`);
    }
    function annotateEntry(key, contract) {
        const sourceContract = getSourceContract(sourceMap[key]);
        return annotateContract(sourceContract, contract);
    }
    return {
        main: closure.main,
        contracts: M.mapWithIndex(annotateEntry)(closure.contracts),
    };
}
export async function mkSourceMap(lifecycle, sourceObjectMap) {
    const closure = await annotatedClosure(lifecycle.restClient, sourceObjectMap);
    return {
        source: sourceObjectMap,
        closure,
        annotateHistory: (history) => {
            return annotateHistoryFromClosure(closure)(history);
        },
        playHistory: (history) => {
            const annotatedHistory = annotateHistoryFromClosure(closure)(history);
            const main = closure.contracts.get(closure.main);
            if (typeof main === "undefined")
                throw new Error(`Cant find main.`);
            return playSingleInputTxTrace(emptyState(0n), main, annotatedHistory);
        },
        createContract: (options) => {
            const contract = stripAnnotations(closure.contracts.get(closure.main));
            return lifecycle.newContractAPI.create({
                ...options,
                contract,
            });
        },
        contractInstanceOf: async (contractId) => {
            const contractDetails = await lifecycle.restClient.getContractById({
                contractId,
            });
            const initialContract = await lifecycle.restClient.getContractSourceById({
                contractSourceId: closure.main,
            });
            return deepEqual(initialContract, contractDetails.initialContract);
        },
    };
}
export async function mkSourceMapRest(restClient, sourceObjectMap) {
    const closure = await annotatedClosure(restClient, sourceObjectMap);
    return {
        source: sourceObjectMap,
        closure,
        annotateHistory: (history) => {
            return annotateHistoryFromClosure(closure)(history);
        },
        playHistory: (history) => {
            const annotatedHistory = annotateHistoryFromClosure(closure)(history);
            const main = closure.contracts.get(closure.main);
            if (typeof main === "undefined")
                throw new Error(`Cant find main.`);
            return playSingleInputTxTrace(emptyState(0n), main, annotatedHistory);
        },
        contractInstanceOf: async (contractId) => {
            const contractDetails = await restClient.getContractById({
                contractId,
            });
            const initialContract = await restClient.getContractSourceById({
                contractSourceId: closure.main,
            });
            return deepEqual(initialContract, contractDetails.initialContract);
        },
    };
}
//# sourceMappingURL=source-map.js.map