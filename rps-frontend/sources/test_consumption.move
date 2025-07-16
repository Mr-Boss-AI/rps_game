module rps_game::test_consumption {
    use sui::coin::Coin;
    use sui::transfer::public_transfer;
    use sui::tx_context::{TxContext, sender};
    
    // Use existing deployed RPS_TOKEN type  
    use 0x10b2ded1f5831401f826fb25307f70f8176cc818703b028182411e0626b2941e::rps_token::RPS_TOKEN;

    /// Simple test: consume a token and send it to sender (should fail showing consumption works)
    public entry fun consume_token_test(
        token: Coin<RPS_TOKEN>,
        ctx: &mut TxContext
    ) {
        // This should consume the token by transferring it to sender
        // The token should disappear from user balance and reappear (proving consumption)
        public_transfer(token, sender(ctx));
    }
    
    /// Simple test: try to read token value without consuming
    public entry fun read_token_test(
        token: &Coin<RPS_TOKEN>,
        _ctx: &mut TxContext
    ) {
        // This should NOT consume the token, just read its value
        let _value = sui::coin::value(token);
        // Token should remain in user wallet
    }
} 