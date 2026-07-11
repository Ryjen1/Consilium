"""Tests for the EIP-712 signer."""
from sosofund.sodex.signer import (
    compute_payload_hash,
    sign_exchange_action,
    build_nonce_ms,
)


def test_compute_payload_hash_deterministic():
    """Same input produces same hash."""
    h1 = compute_payload_hash("newOrder", {"accountID": 0, "symbolID": 1})
    h2 = compute_payload_hash("newOrder", {"accountID": 0, "symbolID": 1})
    assert h1 == h2
    assert len(h1) == 32  # 32 bytes


def test_compute_payload_hash_varies_by_type():
    h1 = compute_payload_hash("newOrder", {"a": 1})
    h2 = compute_payload_hash("cancelOrder", {"a": 1})
    assert h1 != h2


def test_compute_payload_hash_varies_by_params():
    h1 = compute_payload_hash("newOrder", {"a": 1})
    h2 = compute_payload_hash("newOrder", {"a": 2})
    assert h1 != h2


def test_sign_exchange_action_returns_0x_prefixed():
    """Signature should be 0x-prefixed hex with 0x01 prefix byte."""
    # Use a deterministic test key (NOT a real wallet with funds).
    test_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    sig, nonce = sign_exchange_action(
        "perps", "newOrder", {"accountID": 0, "symbolID": 1}, test_key, network="testnet"
    )
    assert sig.startswith("0x")
    # 0x + 01 prefix + 65 bytes = 2 + 2 + 130 = 134 chars
    assert len(sig) == 134
    assert sig[2:4] == "01"  # prefix byte


def test_build_nonce_ms_is_positive():
    nonce = build_nonce_ms()
    assert nonce > 0
    assert nonce > 1_000_000_000_000  # at least year 2001
