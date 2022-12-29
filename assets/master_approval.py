import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def master_approval():
    # Keeping it intuitive; but a lot of duplicate code; could be more compact and succinct.
    haveAssetID = App.globalGetEx(Int(0), Bytes("assetID"))

    basic_checks = Seq([
        Assert(Txn.rekey_to() == Global.zero_address()),
        Assert(Txn.close_remainder_to() == Global.zero_address()),
        Assert(Txn.asset_close_to() == Global.zero_address()),
        Assert(Global.group_size() == Int(1)),
    ])

    handle_creation = Return(Int(1))
    handle_optin = Return(Int(0))
    handle_closeout = Return(Int(1))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))

    # AppArgs = ["Mint", total, name, unitName]
    mint = Seq([
        Assert(Txn.sender() == Global.creator_address()),
        haveAssetID,
        Assert(Not(haveAssetID.hasValue())), # check if asset is created
        
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Btoi(Txn.application_args[1]),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_default_frozen: Int(1),
            TxnField.config_asset_name: Txn.application_args[2],
            TxnField.config_asset_unit_name: Txn.application_args[3],
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(Bytes("assetID"), InnerTxn.created_asset_id()),
        Return(Int(1)),
    ])

    assetID = App.globalGet(Bytes("assetID"))
    supplyBalance = AssetHolding.balance(Global.current_application_address(), assetID)
    hasOptedIn = AssetHolding.balance(Txn.accounts[1], assetID)

    # AppArgs = ["Issue"]
    # Accounts = [receiver]
    issue = Seq([
        Assert(Txn.sender() == Global.creator_address()),
        haveAssetID,
        Assert(haveAssetID.hasValue()), # check if asset is created
        supplyBalance, 
        Assert(supplyBalance.value() >= Int(1)), # check if enough supply
        hasOptedIn,
        Assert(hasOptedIn.hasValue()), # check if receiver has opted in
        Assert(hasOptedIn.value() == Int(0)), # check if receiver has no tokens

        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: assetID,
            TxnField.asset_sender: Global.current_application_address(),
            TxnField.asset_receiver: Txn.accounts[1],
            TxnField.asset_amount: Int(1),
        }),
        InnerTxnBuilder.Submit(),
        Return(Int(1)),
    ])

    # AppArgs = ["Revoke"]
    # Accounts = [target]
    revoke = Seq([
        Assert(Txn.sender() == Global.creator_address()),
        haveAssetID,
        Assert(haveAssetID.hasValue()), # check if asset is created
        hasOptedIn,
        Assert(hasOptedIn.value() == Int(1)), # check if receiver has token

        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_sender: Txn.accounts[1],
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.asset_amount: Int(1),
            TxnField.xfer_asset: assetID,
        }),
        InnerTxnBuilder.Submit(),
        Return(Int(1)),
    ])

    handle_noop = Seq([
        Cond(
            [Txn.application_args[0] == Bytes("Mint"), mint],
            [Txn.application_args[0] == Bytes("Issue"), issue],
            [Txn.application_args[0] == Bytes("Revoke"), revoke],
        ),
    ])
    
    program = Seq([
        basic_checks,
        Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop],
        ),
    ])
    
    return program

if __name__ == "__main__":
    params = {}
    
    # Overwrite params if sys.argv[1] is passed
    if(len(sys.argv) > 1):
        params = parse_params(sys.argv[1], params)
        
    print(compileTeal(master_approval(), mode=Mode.Application, version=6))