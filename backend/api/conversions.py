#  backend\api\conversions.py

from fastapi import APIRouter, Request, Depends
from sqlalchemy import text
from backend.database import get_db
from backend.core.jwt import verify_azure_token  # FIXED IMPORT

router = APIRouter()


@router.get("/")
async def get_conversions(  # FIXED: must be async because JWT verification is async
    request: Request,
    limit: int = 50,
    offset: int = 0,
    db=Depends(get_db),
):
    """
    Uses:
    - Authorization header → logged-in user
    - X-Guest-Id header → anonymous user
    """

    user = None
    guest_id = request.headers.get("X-Guest-Id")

    # ---------------------------------------------------
    # Try JWT auth first (logged-in user)
    # ---------------------------------------------------
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        try:
            payload = await verify_azure_token(token)  # FIXED: async call
            user = {
                "id": payload.get("oid")  # Azure user ID
            }
        except Exception:
            user = None

    # ---------------------------------------------------
    # QUERY SELECTION
    # ---------------------------------------------------
    if user:
        query = """
            SELECT *
            FROM converter
            WHERE user_id = :id
            ORDER BY created_date DESC
            LIMIT :limit OFFSET :offset
        """
        params = {"id": user["id"], "limit": limit, "offset": offset}

    elif guest_id:
        query = """
            SELECT *
            FROM converter
            WHERE guest_id = :id
            ORDER BY created_date DESC
            LIMIT :limit OFFSET :offset
        """
        params = {"id": guest_id, "limit": limit, "offset": offset}

    else:
        return {"items": []}

    result = db.execute(text(query), params)
    rows = result.mappings().all()

    return {"items": rows}