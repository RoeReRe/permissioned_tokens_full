const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");
const { getAssetHoldings } = require("./helper.js");

async function run(runtimeEnv, deployer) {
    const receiverAddr = deployer.accountsByName.get("user1").addr;

    const master = deployer.accountsByName.get("master");
    const masterApp = deployer.getApp("MasterApp");
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");

    // Token holdings before issuing
    console.log("Master Contract Before:", await getAssetHoldings(deployer, masterApp.applicationAccount, assetID));
    console.log("Receiver Before:", await getAssetHoldings(deployer, receiverAddr, assetID));

    // Issue token
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: masterApp.appID,
        payFlags: { totalFee: 2000 },
        appArgs: [convert.stringToBytes("Issue")],
        accounts: [receiverAddr],
        foreignAssets: [assetID],
    })

    // Token holdings after
    console.log("Master Contract After:", await getAssetHoldings(deployer, masterApp.applicationAccount, assetID));
    console.log("Receiver After:", await getAssetHoldings(deployer, receiverAddr, assetID));
}

module.exports = { default: run };