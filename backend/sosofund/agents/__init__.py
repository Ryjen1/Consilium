from .base import Agent, Signal
from .etf_flow import ETFFlowAgent
from .kol_narrative import KOLNarrativeAgent
from .unlock_risk import UnlockRiskAgent

AGENTS: list[Agent] = [ETFFlowAgent(), UnlockRiskAgent(), KOLNarrativeAgent()]

__all__ = ["Agent", "Signal", "ETFFlowAgent", "UnlockRiskAgent", "KOLNarrativeAgent", "AGENTS"]
