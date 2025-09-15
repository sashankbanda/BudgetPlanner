from fastapi_mail import ConnectionConfig
import os
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

#❗ Add validation for required mail environment variables
required_env_vars = ["MAIL_USERNAME", "MAIL_PASSWORD", "MAIL_FROM", "MAIL_PORT", "MAIL_SERVER"]
for var in required_env_vars:
    if not os.environ.get(var):
        raise RuntimeError(f"Missing required environment variable: {var}")
    

conf = ConnectionConfig(
    MAIL_USERNAME=os.environ.get("MAIL_USERNAME"),
    MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD"),
    MAIL_FROM=os.environ.get("MAIL_FROM"),
    MAIL_PORT=int(os.environ.get("MAIL_PORT", 587)),
    MAIL_SERVER=os.environ.get("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,   # replaces MAIL_TLS
    MAIL_SSL_TLS=False,   # replaces MAIL_SSL
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    TEMPLATE_FOLDER=os.path.join(BASE_DIR, "templates"),
    # TEMPLATE_FOLDER="backend/templates",  # fix path!
)
