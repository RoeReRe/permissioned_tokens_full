const { convert, readAppGlobalState, readAppLocalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // For or Against
    const vote = "For";
    const voter = deployer.accountsByName.get("user1");
    
    const master = deployer.accountsByName.get("master");
    const masterApp = deployer.getApp("MasterApp");
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");

    const proposalApp = deployer.getApp("ProposalApp");

    // Opt in to proposal contract
    console.log("Opting into contract...")
    await deployer.executeTx({
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
    await deployer.executeTx({
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