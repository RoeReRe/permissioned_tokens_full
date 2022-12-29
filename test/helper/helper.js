const { convert, runtime } = require("@algo-builder/algob")
const { types } = require("@algo-builder/web");
const { getApplicationAddress } = require("algosdk");

const initContracts = (runtime, master, masterApproval, masterClear, proposalApproval, proposalClear) => {

    // Deploy Master Contract
    runtime.deployApp(
        master,
        {
            appName: "MasterApp",
            metaType: types.MetaType.FILE,
            approvalProgramFilename: masterApproval,
            clearProgramFilename: masterClear,
            localInts: 0,
            localBytes: 0,
            globalInts: 1,
            globalBytes: 0,
        },
        { totalFee: 1000 },
    );

    const masterApp = runtime.getAppByName("MasterApp");
    
    // Fund Master Contract
    runtime.executeTx([{
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: masterApp.applicationAccount,
        amountMicroAlgos: 10e6,
        payFlags: { totalFee: 1000 },
    }]);
    
    // Create tokens
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: masterApp.appID,
        payFlags: { totalFee: 1000 },
        appArgs: [convert.stringToBytes("Mint"),
                convert.uint64ToBigEndian(2),
                convert.stringToBytes("voteToken"),
                convert.stringToBytes("vote")],
    }]);

    const assetID = runtime.getAssetInfoFromName("voteToken").assetIndex;

    // Deploy Proposal Contract
    runtime.deployApp(
        master,
        {
            appName: "ProposalApp",
            metaType: types.MetaType.FILE,
            approvalProgramFilename: proposalApproval,
            clearProgramFilename: proposalClear,
            localInts: 1,
            localBytes: 0,
            globalInts: 4,
            globalBytes: 2,
            appArgs: [convert.stringToBytes("Proposal Title"),
                        convert.stringToBytes("Proposal Desc"),
                        convert.uint64ToBigEndian(assetID)],
        },
        { totalFee: 1000 },
    );
}

const assetOptIn = (runtime, receiver) => {
    runtime.executeTx([{
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: receiver,
        assetID: runtime.getAssetInfoFromName("voteToken").assetIndex,
        payFlags: { totalFee: 1000 },
    }]);
}

const issue = (runtime, master, receiver) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: runtime.getAppByName("MasterApp").appID,
        payFlags: { totalFee: 2000 },
        appArgs: [convert.stringToBytes("Issue")],
        accounts: [receiver.addr],
        foreignAssets: [runtime.getAssetInfoFromName("voteToken").assetIndex],
    }]);
}

const revoke = (runtime, master, target) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: runtime.getAppByName("MasterApp").appID,
        payFlags: { totalFee: 2000 },
        appArgs: [convert.stringToBytes("Revoke")],
        accounts: [target.addr],
        foreignAssets: [runtime.getAssetInfoFromName("voteToken").assetIndex],
    }]);
}

const contractOptIn = (runtime, voter) => {
    runtime.executeTx([{
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: voter,
        appID: runtime.getAppByName("ProposalApp").appID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [runtime.getAssetInfoFromName("voteToken").assetIndex],
    }])
}

const vote = (runtime, voter, vote) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: voter,
        appID: runtime.getAppByName("ProposalApp").appID,
        payFlags: { totalFee: 1000 },
        appArgs: [convert.stringToBytes(vote)],
        foreignAssets: [runtime.getAssetInfoFromName("voteToken").assetIndex],
    }]);
}

module.exports = {
    initContracts,
    assetOptIn,
    issue,
    revoke,
    contractOptIn,
    vote,
}