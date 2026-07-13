import os
import requests
import jwt
from jwt.algorithms import RSAAlgorithm
from jwt.exceptions import PyJWTError
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from config import Config
from models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    db.init_app(app)
    
    clerk_jwks_cache = {}
    
    def get_clerk_public_key(kid):
        """Recupere la cle publique associee a un Key ID depuis le cache ou l'API de Clerk."""
        if kid in clerk_jwks_cache:
            return clerk_jwks_cache[kid]
            
        jwks_url = app.config['CLERK_JWKS_URL']
        if not jwks_url:
            return None
            
        try:
            response = requests.get(jwks_url)
            if response.status_code == 200:
                jwks = response.json()
                for key in jwks.get('keys', []):
                    if key.get('kid') == kid:
                        public_key = RSAAlgorithm.from_jwk(key)
                        clerk_jwks_cache[kid] = public_key
                        return public_key
        except Exception as e:
            app.logger.error(f"Erreur lors de la recuperation des cles JWKS : {str(e)}")
            
        return None

    def token_required(f):
        """Decorateur pour securiser les routes avec Clerk JWT."""
        from functools import wraps
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            
            if not token:
                return jsonify({'error': 'Token d\'autorisation manquant'}), 401
                
            try:
                unverified_header = jwt.get_unverified_header(token)
                kid = unverified_header.get('kid')
                if not kid:
                    return jsonify({'error': 'En-tete JWT invalide (kid manquant)'}), 401
                    
                public_key = get_clerk_public_key(kid)
                if not public_key:
                    return jsonify({'error': 'Cle publique introuvable pour ce token'}), 401
                
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=['RS256'],
                    options={"verify_signature": True, "verify_aud": False}
                )
                
                g.user_id = payload.get('sub')
                g.user_payload = payload
                
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Le token a expire'}), 401
            except PyJWTError as e:
                return jsonify({'error': f'Token invalide : {str(e)}'}), 401
            except Exception as e:
                return jsonify({'error': f'Erreur de validation du token : {str(e)}'}), 500
                
            return f(*args, **kwargs)
        return decorated

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'OK', 'database': 'connected'}), 200

    @app.route('/api/protected', methods=['GET'])
    @token_required
    def protected_route():
        return jsonify({
            'message': 'Acces autorise par Clerk',
            'clerk_user_id': g.user_id,
            'token_claims': g.user_payload
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
