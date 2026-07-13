import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'votre_cle_secrete_par_defaut_cnt_gabon')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Base de donnees
    DB_USER = os.environ.get('DB_USER', 'cnt_user')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'votre_mot_de_passe_securise')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '3306')
    DB_NAME = os.environ.get('DB_NAME', 'cnt_gabon')
    
    SQLALCHEMY_DATABASE_URI = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Configuration Clerk
    CLERK_API_KEY = os.environ.get('CLERK_API_KEY', '')
    CLERK_JWKS_URL = os.environ.get('CLERK_JWKS_URL', 'https://api.clerk.com/v1/jwks')
