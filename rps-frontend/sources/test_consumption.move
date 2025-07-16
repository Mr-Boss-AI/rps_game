module rps_game::test_consumption {
    use sui::coin::Coin;
    use sui::transfer::public_transfer;
    use sui::tx_context::{TxContext, sender};
    
    // Use existing deployed RPS_TOKEN type  
    use 0x55596a95eecb8c091a62c8c378d6d27941ed39f1ac75799e490d602df4e1534c::rps_token::RPS_TOKEN;

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