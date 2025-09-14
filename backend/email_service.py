import os
from fastapi_mail import ConnectionConfig
from dotenv import load_dotenv
from pathlib import Path
from fastapi import HTTPException

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Check for required environment variables at startup
if not all([os.environ.get("MAIL_USERNAME"), os.environ.get("MAIL_PASSWORD"), os.environ.get("MAIL_FROM")]):
    print("Warning: Email environment variables (MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM) are not set.")

conf = ConnectionConfig(
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME"),
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD"),
    MAIL_FROM = os.environ.get("MAIL_FROM"),
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587)),
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
    # ⚠️ FIX: The library expects `MAIL_USE_TLS` and `MAIL_USE_SSL` as booleans, not strings.
    # The error message from Pydantic is slightly misleading, but the core issue is the model fields changed.
    # We will pass the values directly as booleans to avoid the `extra_forbidden` error.
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", 'True').lower() in ('true', '1', 't'),
    MAIL_USE_SSL = os.environ.get("MAIL_USE_SSL", 'False').lower() in ('true', '1', 't'),
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True,
    TEMPLATE_FOLDER = ROOT_DIR / 'templates',
    # Removed the previous timeout setting as it was ineffective.
)