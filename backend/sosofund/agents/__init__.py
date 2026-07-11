from .base import Agent, Signal
from .etf_flow import ETFFlowAgent
from .kol_narrative import KOLNarrativeAgent
from .liquidity_depth import LiquidityDepthAgent
from .macro import MacroAgent
from .sector_rotation import SectorRotationAgent
from .unlock_risk import UnlockRiskAgent

AGENTS: list[Agent] = [
    ETFFlowAgent(),
    UnlockRiskAgent(),
    KOLNarrativeAgent(),
    MacroAgent(),
    LiquidityDepthAgent(),
    SectorRotationAgent(),
]

__all__ = [
    "Agent",
    "Signal",
    "ETFFlowAgent",
    "UnlockRiskAgent",
    "KOLNarrativeAgent",
    "MacroAgent",
    "LiquidityDepthAgent",
    "SectorRotationAgent",
    "AGENTS",
]
