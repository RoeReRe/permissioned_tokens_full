const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const { getAssetHoldings } = require("./helper.js");

async function run(runtimeEnv, deployer) {
    const targetAddr = deployer.accountsByName.get("user1").addr;

    const master = deployer.accountsByName.get("master");
    const masterApp = deployer.getApp("MasterApp");
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");

    // Token holdings before revoking
    console.log("Master Contract Before:", await getAssetHoldings(deployer, masterApp.applicationAccount, assetID));
    console.log("Target Before:", await getAssetHoldings(deployer, targetAddr, assetID));

    // Revoke token
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: masterApp.appID,
        payFlags: { totalFee: 2000 },
        appArgs: [convert.stringToBytes("Revoke")],
        accounts: [targetAddr],
        foreignAssets: [assetID],
    })

    // Token holdings after
    console.log("Master Contract After:", await getAssetHoldings(deployer, masterApp.applicationAccount, assetID));
    console.log("Target After:", await getAssetHoldings(deployer, targetAddr, assetID));
}

module.exports = { default: run };