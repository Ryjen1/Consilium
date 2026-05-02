from .state import FundState, Trade


def build_graph():
    from .pipeline import build_graph as _build

    return _build()


async def run_cycle(*args, **kwargs):
    from .pipeline import run_cycle as _run

    return await _run(*args, **kwargs)


__all__ = ["FundState", "Trade", "build_graph", "run_cycle"]
