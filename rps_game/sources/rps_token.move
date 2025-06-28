module rps_game::rps_token {
    use std::option;
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// One-time witness type (must be uppercase module name)
    struct RPS_TOKEN has drop {}

    /// Module initializer is called once on module publish
    fun init(witness: RPS_TOKEN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            2,                               // decimals
            b"RPS",                         // symbol
            b"RPS Token",                   // name  
            b"Token for Rock Paper Scissors Game", // description
            option::none(),                 // icon url
            ctx
        );
        
        // Transfer the treasury to the publisher
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }

    /// For testing - mint some tokens
    public entry fun mint_for_testing(
        treasury: &mut TreasuryCap<RPS_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }
}