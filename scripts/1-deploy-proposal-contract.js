const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    const title = "Proposal Title";
    const desc = "Description of the Proposal";

    const master = deployer.accountsByName.get("master");
    
    // Deploy Proposal Contract
    console.log("Deploying Proposal Contract...");
    const masterApprovalFile = "master_approval.py";
    const masterClearStateFile = "master_clearstate.py";
    const proposalApprovalFile = "proposal_approval.py";
    const proposalClearStateFile = "proposal_clearstate.py";

    const masterApp = deployer.getApp(masterApprovalFile, masterClearStateFile);
    const masterState = await readAppGlobalState(deployer, master.addr, masterApp.appID);
    const assetID = masterState.get("assetID");

    await deployer.deployApp(
        proposalApprovalFile,
        proposalClearStateFile,
        {
            sender: master,
            localInts: 1,
            localBytes: 0,
            globalInts: 4,
            globalBytes: 2,
            appArgs: [convert.stringToBytes(title),
                        convert.stringToBytes(desc),
                        convert.uint64ToBigEndian(assetID)],
        },
        { totalFee: 1000 },
    );

    const proposalApp = deployer.getApp(proposalApprovalFile, proposalClearStateFile);

    // Save AppID and AppAddress in checkpoint for easy access in frontend;
    await deployer.addCheckpointKV("AppID", proposalApp.appID);
    await deployer.addCheckpointKV("AppAddress", proposalApp.applicationAccount);
    
    // Test
    console.log(await readAppGlobalState(deployer, master.addr, proposalApp.appID));
}

module.exports = { default: run };