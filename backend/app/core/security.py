import base64
import hashlib
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

PASSWORD_HASH_PREFIX = "bcrypt_sha256$"
BCRYPT_ROUNDS = 12

security = HTTPBearer(auto_error=False)


def _password_bytes(password: str) -> bytes:
    return password.encode("utf-8")


def _legacy_bcrypt_password(password: str) -> bytes:
    # Older bcrypt hashes only use the first 72 password bytes.
    return _password_bytes(password)[:72]


def _bcrypt_sha256_password(password: str) -> bytes:
    digest = hashlib.sha256(_password_bytes(password)).digest()
    return base64.b64encode(digest)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if hashed_password.startswith(PASSWORD_HASH_PREFIX):
            current_hash = hashed_password.removeprefix(PASSWORD_HASH_PREFIX).encode("utf-8")
            return bcrypt.checkpw(_bcrypt_sha256_password(plain_password), current_hash)

        return bcrypt.checkpw(_legacy_bcrypt_password(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    hashed = bcrypt.hashpw(
        _bcrypt_sha256_password(password),
        bcrypt.gensalt(rounds=BCRYPT_ROUNDS),
    ).decode("utf-8")
    return f"{PASSWORD_HASH_PREFIX}{hashed}"


def password_needs_rehash(hashed_password: str) -> bool:
    return not hashed_password.startswith(PASSWORD_HASH_PREFIX)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User
    from sqlalchemy import select

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated",
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
