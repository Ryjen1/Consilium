"""EIP-712 signer for SoDEX writes.

Implements the exact signing rules from the SoDEX developer docs:

    https://sodex.com/documentation/api/api

Summary:
    1. `payloadHash = keccak256(json.Marshal(payload))` where payload is
       {"type": "<actionName>", "params": { ... }}.
    2. JSON must be compact (no whitespace) and key-order must match the Go
       struct field order the server re-marshals against.
    3. DecimalString fields (price, quantity, funds, stopPrice) are JSON
       strings.
    4. Optional `omitempty` fields must be omitted when unset.
    5. EIP-712 domain:
            name:              "spot" for spot actions, "futures" for perps
            version:           "1"
            chainId:           286623 (mainnet) | 138565 (testnet)
            verifyingContract: zero address
       primaryType: "ExchangeAction"
       message:     { payloadHash: <bytes32>, nonce: <uint64 ms> }
    6. Prepend the byte 0x01 to the 65-byte ECDSA signature.
"""
from __future__ import annotations

import json
import time
from typing import Any, Literal

from eth_account import Account
from eth_account.messages import encode_typed_data
from eth_utils import keccak

from ..config import get_settings

Market = Literal["spot", "perps"]

CHAIN_ID_MAINNET = 286623
CHAIN_ID_TESTNET = 138565
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def _domain(market: Market, network: str) -> dict[str, Any]:
    return {
        "name": "spot" if market == "spot" else "futures",
        "version": "1",
        "chainId": CHAIN_ID_MAINNET if network == "mainnet" else CHAIN_ID_TESTNET,
        "verifyingContract": ZERO_ADDRESS,
    }


def _compact_json(obj: Any) -> bytes:
    """Compact, stable JSON serialization matching Go's json.Marshal output."""
    # json.dumps preserves insertion order in Python 3.7+, and the caller is
    # responsible for passing dicts in the correct Go struct field order.
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def compute_payload_hash(action_type: str, params: dict[str, Any]) -> bytes:
    """Compute the 32-byte keccak256 payload hash SoDEX expects."""
    payload = {"type": action_type, "params": params}
    return keccak(_compact_json(payload))


def build_nonce_ms() -> int:
    """Millisecond nonce. SoDEX requires it within (T-2d, T+1d)."""
    return int(time.time() * 1000)


def sign_exchange_action(
    market: Market,
    action_type: str,
    params: dict[str, Any],
    private_key: str,
    network: str = "testnet",
    nonce_ms: int | None = None,
) -> tuple[str, int]:
    """Sign an ExchangeAction and return (typed_signature_hex, nonce_ms).

    The returned signature already includes the 0x01 prefix byte SoDEX expects.
    """
    nonce = nonce_ms or build_nonce_ms()
    payload_hash = compute_payload_hash(action_type, params)

    types = {
        "EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"},
        ],
        "ExchangeAction": [
            {"name": "payloadHash", "type": "bytes32"},
            {"name": "nonce", "type": "uint64"},
        ],
    }
    typed = {
        "types": types,
        "domain": _domain(market, network),
        "primaryType": "ExchangeAction",
        "message": {
            "payloadHash": payload_hash,
            "nonce": nonce,
        },
    }
    signable = encode_typed_data(full_message=typed)
    signed = Account.sign_message(signable, private_key=private_key)
    # SoDEX expects a 66-byte typed signature: 0x01 || 65-byte ECDSA sig.
    raw = signed.signature
    prefixed = b"\x01" + bytes(raw)
    return "0x" + prefixed.hex(), nonce


def make_auth_headers(
    market: Market,
    action_type: str,
    params: dict[str, Any],
    *,
    api_key_name: str | None = None,
    private_key: str | None = None,
    network: str | None = None,
) -> tuple[dict[str, str], int]:
    """Build the X-API-Key / X-API-Sign / X-API-Nonce headers for a signed write.

    Defaults come from settings so callers can pass just the action payload.
    """
    s = get_settings()
    pk = private_key or s.sodex_evm_private_key
    if not pk:
        raise RuntimeError(
            "SoDEX execution requires SODEX_EVM_PRIVATE_KEY in .env"
        )
    name = api_key_name or s.sodex_api_key_name
    net = network or s.sodex_network
    sig, nonce = sign_exchange_action(market, action_type, params, pk, network=net)
    return (
        {
            "X-API-Key": name,
            "X-API-Sign": sig,
            "X-API-Nonce": str(nonce),
        },
        nonce,
    )
