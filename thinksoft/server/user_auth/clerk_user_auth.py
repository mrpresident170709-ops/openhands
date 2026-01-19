from dataclasses import dataclass
import os
import jwt
from jwt import PyJWKClient
from fastapi import Request, HTTPException, status
from pydantic import SecretStr

from thinksoft.server import shared
from thinksoft.server.settings import Settings
from thinksoft.server.user_auth.user_auth import UserAuth
from thinksoft.storage.data_models.secrets import Secrets
from thinksoft.storage.secrets.secrets_store import SecretsStore
from thinksoft.storage.settings.settings_store import SettingsStore
from thinksoft.integrations.provider import PROVIDER_TOKEN_TYPE
from thinksoft.core.logger import openhands_logger as logger

@dataclass
class ClerkUserAuth(UserAuth):
    """Clerk user authentication mechanism"""

    user_id: str | None = None
    email: str | None = None
    token: SecretStr | None = None

    _settings: Settings | None = None
    _settings_store: SettingsStore | None = None
    _secrets_store: SecretsStore | None = None
    _secrets: Secrets | None = None

    async def get_user_id(self) -> str | None:
        return self.user_id

    async def get_user_email(self) -> str | None:
        return self.email

    async def get_access_token(self) -> SecretStr | None:
        return self.token

    async def get_user_settings_store(self) -> SettingsStore:
        settings_store = self._settings_store
        if settings_store:
            return settings_store
        user_id = await self.get_user_id()
        if not user_id:
             raise ValueError("User ID is required to get settings store")

        settings_store = await shared.SettingsStoreImpl.get_instance(
            shared.config, user_id
        )
        if settings_store is None:
            raise ValueError('Failed to get settings store instance')
        self._settings_store = settings_store
        return settings_store

    async def get_user_settings(self) -> Settings | None:
        settings = self._settings
        if settings:
            return settings
        try:
            settings_store = await self.get_user_settings_store()
            settings = await settings_store.load()

            # Merge config.toml settings with stored settings
            if settings:
                settings = settings.merge_with_config_settings()

            self._settings = settings
            return settings
        except Exception as e:
            logger.warning(f"Failed to load user settings: {e}")
            return None

    async def get_secrets_store(self) -> SecretsStore:
        secrets_store = self._secrets_store
        if secrets_store:
            return secrets_store
        user_id = await self.get_user_id()
        if not user_id:
            raise ValueError("User ID is required to get secrets store")

        secret_store = await shared.SecretsStoreImpl.get_instance(
            shared.config, user_id
        )
        if secret_store is None:
            raise ValueError('Failed to get secrets store instance')
        self._secrets_store = secret_store
        return secret_store

    async def get_secrets(self) -> Secrets | None:
        user_secrets = self._secrets
        if user_secrets:
            return user_secrets
        try:
            secrets_store = await self.get_secrets_store()
            user_secrets = await secrets_store.load()
            self._secrets = user_secrets
            return user_secrets
        except Exception as e:
            logger.warning(f"Failed to load user secrets: {e}")
            return None

    async def get_provider_tokens(self) -> PROVIDER_TOKEN_TYPE | None:
        user_secrets = await self.get_secrets()
        if user_secrets is None:
            return None
        return user_secrets.provider_tokens

    async def get_mcp_api_key(self) -> str | None:
        return None

    @classmethod
    async def get_instance(cls, request: Request) -> UserAuth:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # Fallback for unauthenticated requests if acceptable, or raise
            # For strict Clerk auth, we might want to return an empty/guest auth or raise 401
            # But the protocol allows getting instance without immediate failure,
            # failure happens when accessing protected data.
            # However, typical usage is: if get_instance fails/returns empty, user is anonymous.
            # Let's return an empty instance which will return None for user_id.
            return ClerkUserAuth()

        token = auth_header.split(" ")[1]

        # Verify token
        # We need CLERK_ISSUER_URL env var, e.g. https://<your-clerk-domain>.clerk.accounts.dev
        issuer_url = os.environ.get("CLERK_ISSUER_URL")
        if not issuer_url:
            logger.error("CLERK_ISSUER_URL environment variable is not set")
            # Fail safe
            return ClerkUserAuth()

        jwks_url = f"{issuer_url}/.well-known/jwks.json"

        try:
            jwks_client = PyJWKClient(jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            data = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=None, # Clerk tokens often don't check audience by default in this context or it matches origin
                issuer=issuer_url
            )

            user_id = data.get("sub")
            email = None
            # Email might be in the token if configured in Clerk session token template
            # For now we rely on user_id.

            return ClerkUserAuth(
                user_id=user_id,
                email=email,
                token=SecretStr(token)
            )
        except jwt.PyJWTError as e:
            logger.warning(f"Failed to verify Clerk token: {e}")
            return ClerkUserAuth()
        except Exception as e:
            logger.error(f"Error validating Clerk token: {e}")
            return ClerkUserAuth()


    @classmethod
    async def get_for_user(cls, user_id: str) -> UserAuth:
        # This is used for background tasks or when we trust the caller has verified identity
        return ClerkUserAuth(user_id=user_id)
