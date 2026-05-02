"""Application settings. Loaded from env / .env."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # SoSoValue
    soso_api_key: str = Field(default="", description="Leave empty for MOCK mode")
    soso_base_url: str = "https://openapi.sosovalue.com/openapi/v1"

    # LLM
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # App
    app_env: str = "dev"
    database_url: str = "sqlite+aiosqlite:///./sosofund.db"
    cors_origins: str = "http://localhost:3000"

    @property
    def mock_mode(self) -> bool:
        return not self.soso_api_key

    @property
    def llm_enabled(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
