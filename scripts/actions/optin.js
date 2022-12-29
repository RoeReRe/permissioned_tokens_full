const { convert, readAppGlobalState, executeTransaction } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const { getAssetHoldings } = require("./helper.js");

async function run(runtimeEnv, deployer) {
    const receiver = deployer.accountsByName.get("user2");
    
    const master = deployer.accountsByName.get("master");

    const masterApprovalFile = "master_approval.py";
    const masterClearStateFile = "master_clearstate.py";
    const masterApp = deployer.getApp(masterApprovalFile, masterClearStateFile);
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");

    // Asset Opt In
    await executeTransaction(deployer, {
        type: types.TransactionType.OptInASA,
        sign: types.SignType.SecretKey,
        fromAccount: receiver,
        assetID: assetID,
        payFlags: { totalFee: 1000 },
    })

    console.log(await getAssetHoldings(deployer, receiver.addr, assetID));
}

module.exports = { default: run };