module rps_game::rps_token {
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};
    use sui::url;
    use std::option;

    /// The token type for our RPS game
    struct RPS_TOKEN has drop {}

    /// Initialize the token when the module is published
    fun init(witness: RPS_TOKEN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            2, // decimals
            b"RPS",
            b"RPS Token",
            b"Token for Rock Paper Scissors Game",
            option::none(),
            ctx
        );
        
        // Transfer treasury cap to the sender
        transfer::public_transfer(treasury, sender(ctx));
        
        // Freeze the metadata
        transfer::public_freeze_object(metadata);
    }

    /// Mint tokens for testing
    public entry fun mint_for_testing(
        treasury: &mut TreasuryCap<RPS_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let c = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(c, recipient);
    }
} 