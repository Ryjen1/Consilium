from .base import Agent, Signal
from .etf_flow import ETFFlowAgent
from .kol_narrative import KOLNarrativeAgent
from .macro import MacroAgent
from .unlock_risk import UnlockRiskAgent

AGENTS: list[Agent] = [
    ETFFlowAgent(),
    UnlockRiskAgent(),
    KOLNarrativeAgent(),
    MacroAgent(),
]

__all__ = [
    "Agent",
    "Signal",
    "ETFFlowAgent",
    "UnlockRiskAgent",
    "KOLNarrativeAgent",
    "MacroAgent",
    "AGENTS",
]
