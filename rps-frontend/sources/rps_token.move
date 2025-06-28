module rps_game::rps_token {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;

    /// The token type used in the game
    struct RpsToken has copy, drop, store {}
}
