#   backend\dependencies\user.py

from fastapi import Request

from backend.core.jwt import verify_azure_token, TokenError


async def get_optional_user(request: Request):
    auth = request.headers.get("Authorization")

    print("AUTH HEADER:", auth)

    if not auth or not auth.startswith("Bearer "):
        print("NO TOKEN FOUND")
        return None

    token = auth.split(" ", 1)[1]

    try:
        payload = await verify_azure_token(token)

        print("USER AUTHENTICATED")
        print("OID:", payload.get("oid"))
        print("AUD:", payload.get("aud"))

        return payload

    except TokenError as e:
        print("TOKEN ERROR:", e)
        return None