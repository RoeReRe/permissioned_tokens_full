import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def proposal_approval():

    basic_checks = Seq([
        Assert(Txn.rekey_to() == Global.zero_address()),
        Assert(Txn.close_remainder_to() == Global.zero_address()),
        Assert(Txn.asset_close_to() == Global.zero_address()),
        Assert(Global.group_size() == Int(1)),
    ])

    # AppArgs = [Title, Desc, assetID]
    handle_creation = Seq([
        App.globalPut(Bytes("Title"), Txn.application_args[0]),
        App.globalPut(Bytes("Desc"), Txn.application_args[1]),
        App.globalPut(Bytes("assetID"), Btoi(Txn.application_args[2])),
        App.globalPut(Bytes("For"), Int(0)),
        App.globalPut(Bytes("Against"), Int(0)),
        Return(Int(1)),
    ])

    assetID = App.globalGet(Bytes("assetID"))
    hasOptedIn = AssetHolding.balance(Txn.sender(), assetID)

    handle_optin = Seq([
        Assert(App.optedIn(Txn.sender(), Txn.application_id())), # check if user is opted in
        hasOptedIn,
        Assert(hasOptedIn.value() == Int(1)), # check if user has token

        App.localPut(Txn.sender(), Bytes("Voted"), Int(0)),
        Return(Int(1)),
    ])
    
    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))

    voteChecks = Seq([
        Assert(App.optedIn(Txn.sender(), Txn.application_id())), # check if user is opted in
        hasOptedIn,
        Assert(hasOptedIn.value() == Int(1)), # check if user has token
        Assert(App.localGet(Txn.sender(), Bytes("Voted")) == Int(0)) # check that user has not voted
    ])

    # AppArgs = ["For"]
    voteFor = Seq([
        voteChecks,
        App.localPut(Txn.sender(), Bytes("Voted"), Int(1)),
        App.globalPut(Bytes("For"), App.globalGet(Bytes("For")) + Int(1)),
        Return(Int(1)),
    ])

    # AppArgs = ["Against"]
    voteAgainst = Seq([
        voteChecks,
        App.localPut(Txn.sender(), Bytes("Voted"), Int(1)),
        App.globalPut(Bytes("Against"), App.globalGet(Bytes("Against")) + Int(1)),
        Return(Int(1)),
    ])

    handle_noop = Cond(
        [Txn.application_args[0] == Bytes("For"), voteFor],
        [Txn.application_args[0] == Bytes("Against"), voteAgainst],
    )
    
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
        
    print(compileTeal(proposal_approval(), mode=Mode.Application, version=6))