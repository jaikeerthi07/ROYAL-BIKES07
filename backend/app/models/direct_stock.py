from datetime import datetime
from app.extensions import db

class DirectStock(db.Model):
    __tablename__ = 'direct_stock'

    id = db.Column(db.Integer, primary_key=True)
    organization = db.Column(db.String(100), nullable=False, default='ROYAL BIKES')
    date = db.Column(db.String(20), nullable=False)
    vendor = db.Column(db.String(150), nullable=False)
    product = db.Column(db.String(150), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    engine_number = db.Column(db.String(100), nullable=False)
    chassis_number = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(80), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'organization': self.organization,
            'date': self.date,
            'vendor': self.vendor,
            'product': self.product,
            'quantity': self.quantity,
            'engineNumber': self.engine_number,
            'chassisNumber': self.chassis_number,
            'color': self.color,
            'notes': self.notes or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
