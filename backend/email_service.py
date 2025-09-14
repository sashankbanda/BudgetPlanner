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
    # This check is more for local development, but good practice
    # The mail sending task will fail silently in the background if these are missing on production
    print("Warning: Email environment variables (MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM) are not set.")

conf = ConnectionConfig(
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME"),
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD"), # Use the App Password here
    MAIL_FROM = os.environ.get("MAIL_FROM"),
    # Reverting to STARTTLS on port 587 as this is a common and sometimes required configuration
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 587)),
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True, # Enable STARTTLS
    MAIL_SSL_TLS = False, # Disable SSL/TLS for STARTTLS
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True,
    TEMPLATE_FOLDER = ROOT_DIR / 'templates'
)