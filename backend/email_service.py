import os
from fastapi_mail import ConnectionConfig
from dotenv import load_dotenv
from pathlib import Path

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
    # ⚠️ FIX: Corrected parameter names based on the error log.
    MAIL_STARTTLS = os.environ.get("MAIL_STARTTLS", 'True').lower() in ('true', '1', 't'),
    MAIL_SSL_TLS = os.environ.get("MAIL_SSL_TLS", 'False').lower() in ('true', '1', 't'),
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True,
    TEMPLATE_FOLDER = ROOT_DIR / 'templates',
)