// TODO: Candidate for runtime lifecycle helper
export const getContractClosure = ({ restClient }) => async (contractSourceId) => {
    const ids = await restClient.getContractSourceClosure({
        contractSourceId,
    });
    const objectEntries = await Promise.all(ids.results.map((id) => restClient.getContractSourceById({ contractSourceId: id }).then((c) => [id, c])));
    return {
        main: contractSourceId,
        contracts: new Map(objectEntries),
    };
};
//# sourceMappingURL=contract-closure.js.map