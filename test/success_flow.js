const { types } = require("@algo-builder/web");
const { assert, expect } = require("chai");
const { Runtime, AccountStore, ERRORS } = require("@algo-builder/runtime");
const helper = require("./helper/helper.js");
const { getApplicationAddress } = require("algosdk");

const masterApproval = "master_approval.py"
const masterClearState = "master_clearstate.py";
const proposalApproval = "proposal_approval.py";
const proposalClearState = "proposal_clearstate.py";

describe("Success Flow", function() {
    let master;
    let user1;
    let user2;
    let user3;
    let illegal;
    let masterApp;
    let proposalApp;
    let runtime;

    this.beforeEach(async function() {
        master = new AccountStore(100e6);
        user1 = new AccountStore(100e6);
        user2 = new AccountStore(100e6);
        user3 = new AccountStore(100e6);
        illegal = new AccountStore(100e6);
        runtime = new Runtime([master, user1, user2, user3, illegal]);
    })

    function syncAccounts() {
        master = runtime.getAccount(master.address);
        user1 = runtime.getAccount(user1.address);
        user2 = runtime.getAccount(user2.address);
        user3 = runtime.getAccount(user3.address);
        illegal = runtime.getAccount(illegal.address);
    }

    const getAppAssetHolding = (appID, assetID) => runtime.getAccount(getApplicationAddress(appID)).getAssetHolding(assetID).amount;
    const getGlobal = (appID, key) => runtime.getGlobalState(appID, key);
    const initContracts = (runtime) => helper.initContracts(runtime, master.account, masterApproval, masterClearState, proposalApproval, proposalClearState);

    it('Deploy contracts', () => {        
        // Deploy contracts
        initContracts(runtime);

        assert.isDefined(runtime.getAppInfoFromName(masterApproval, masterClearState));
        assert.isDefined(runtime.getAppInfoFromName(proposalApproval, proposalClearState));
    })

    it('Opt in user1 into asset', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        syncAccounts();
        const assetID = runtime.getAssetInfoFromName("voteToken").assetIndex;
        assert.equal(user1.getAssetHolding(assetID).amount, 0);
    })

    it('Issue one token', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        syncAccounts();
        const assetID = runtime.getAssetInfoFromName("voteToken").assetIndex;
        assert.equal(user1.getAssetHolding(assetID).amount, 1);
    })

    it('Revoke one token', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Revoke token
        helper.revoke(runtime, master.account, user1.account);

        syncAccounts();
        const assetID = runtime.getAssetInfoFromName("voteToken").assetIndex;
        assert.equal(user1.getAssetHolding(assetID).amount, 0);
    })

    it('Opt user into contract', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Opt user1 into contract
        helper.contractOptIn(runtime, user1.account);

        syncAccounts();
        const proposalApp = runtime.getAppInfoFromName(proposalApproval, proposalClearState);
        assert.equal(runtime.getLocalState(proposalApp.appID, user1.account.addr, "Voted"), 0);
    })

    it('Vote', () => {
        // Deploy contracts
        initContracts(runtime);

        // Opt in user1 into asset
        helper.assetOptIn(runtime, user1.account);

        // Issue token
        helper.issue(runtime, master.account, user1.account);

        // Opt user1 into contract
        helper.contractOptIn(runtime, user1.account);

        // Vote
        helper.vote(runtime, user1.account, "For");

        const proposalApp = runtime.getAppInfoFromName(proposalApproval, proposalClearState);
        assert.equal(getGlobal(proposalApp.appID, "For"), 1);
        assert.equal(getGlobal(proposalApp.appID, "Against"), 0);
    })
})