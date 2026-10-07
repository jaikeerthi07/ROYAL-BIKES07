import os
import sys

# Ensure backend root directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from flask import Flask, jsonify
from config import Config
from app.extensions import db, jwt, bcrypt, cors, migrate
from app.routes.auth_routes import auth_bp
from app.routes.user_routes import user_bp
from app.routes.product_routes import product_bp
from app.routes.customer_routes import customer_bp
from app.routes.receipt_routes import receipt_bp
from app.routes.voucher_routes import voucher_bp
from app.routes.rtn_payment_routes import rtn_payment_bp
from app.routes.delivery_challan_routes import delivery_challan_bp
from app.routes.booking_order_routes import booking_order_bp
from app.routes.report_routes import report_bp
from app.routes.direct_stock_routes import direct_stock_bp

def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(Config)

    if config_name == 'testing':
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key'

    # Initialize Flask Extensions from root config
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    migrate.init_app(app, db)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(receipt_bp)
    app.register_blueprint(voucher_bp)
    app.register_blueprint(rtn_payment_bp)
    app.register_blueprint(delivery_challan_bp)
    app.register_blueprint(booking_order_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(direct_stock_bp)

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'success': False, 'message': 'API endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if hasattr(e, 'code') and isinstance(e.code, int):
            return jsonify({'success': False, 'message': str(e)}), e.code
        
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    # Index Healthcheck
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'online',
            'app': 'RoyalBikes API',
            'version': '1.0.0'
        }), 200

    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'success': True,
            'message': 'Royal Bikes API is running perfectly on Vercel.'
        }), 200

    return app


def seed_database():
    from app.models.user import User

    # Seed Admin User
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@royalbikes.com', role='admin')
        admin.set_password('Admin@123')
        db.session.add(admin)
        db.session.commit()
