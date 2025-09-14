import os
from fastapi_mail import ConnectionConfig
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

conf = ConnectionConfig(
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME"),
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD"), # Use the App Password here
    MAIL_FROM = os.environ.get("MAIL_FROM"),
    # ✨ FIX: Use port 465 with SSL/TLS enabled for more reliable connection
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 465)),
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = False, # Disable STARTTLS
    MAIL_SSL_TLS = True, # Enable SSL/TLS
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True,
    TEMPLATE_FOLDER = ROOT_DIR / 'templates'
)