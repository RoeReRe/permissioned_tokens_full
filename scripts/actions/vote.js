const { convert, readAppGlobalState, readAppLocalState, executeTransaction } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // For or Against
    const vote = "For";
    const voter = deployer.accountsByName.get("user2");
    
    const master = deployer.accountsByName.get("master");
    
    const masterApprovalFile = "master_approval.py";
    const masterClearStateFile = "master_clearstate.py";
    const proposalApprovalFile = "proposal_approval.py";
    const proposalClearStateFile = "proposal_clearstate.py";
    const masterApp = deployer.getApp(masterApprovalFile, masterClearStateFile);
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");
    const proposalApp = deployer.getApp(proposalApprovalFile, proposalClearStateFile);

    // Opt in to proposal contract
    console.log("Opting into contract...")
    await executeTransaction(deployer, {
        type: types.TransactionType.OptInToApp,
        sign: types.SignType.SecretKey,
        fromAccount: voter,
        appID: proposalApp.appID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
    });

    // States before voting
    console.log("App State Before:", await readAppGlobalState(deployer, master.addr, proposalApp.appID));
    console.log("Voter State Before:", await readAppLocalState(deployer, voter.addr, proposalApp.appID));

    // Vote
    await executeTransaction(deployer, {
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: voter,
        appID: proposalApp.appID,
        payFlags: { totalFee: 1000 },
        appArgs: [convert.stringToBytes(vote)],
        foreignAssets: [assetID],
    });

    // States after voting
    console.log("App State After:", await readAppGlobalState(deployer, master.addr, proposalApp.appID));
    console.log("Voter State After:", await readAppLocalState(deployer, voter.addr, proposalApp.appID));
}

module.exports = { default: run };