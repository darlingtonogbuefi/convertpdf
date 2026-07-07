#  backend\run_migrations.py


from alembic.config import Config
from alembic import command

cfg = Config("backend/alembic.ini")
command.upgrade(cfg, "head")
print("✅ Alembic migrations applied successfully")