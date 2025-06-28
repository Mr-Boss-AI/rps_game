module rps_game::rps_token {
    use std::string;
    use sui::coin::{Self, TreasuryCap};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::balance;
    use sui::transfer;

    // Define the new coin type
    struct RpsToken has store, drop {}

    // Public function to initialize the coin type and mint treasury
    public fun init(ctx: &mut TxContext): (TreasuryCap<RpsToken>) {
        Coin::register<RpsToken>(ctx);
        let name = string::utf8(b"RPS Token");
        let symbol = string::utf8(b"RPS");
        let decimals = 2;
        Coin::initialize<RpsToken>(name, symbol, decimals, ctx)
    }

    // Only the holder of the TreasuryCap can mint new tokens
    public fun mint(
        treasury: &mut TreasuryCap<RpsToken>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = Coin::mint(treasury, amount, ctx);
        transfer::transfer(coin, recipient);
    }
}
