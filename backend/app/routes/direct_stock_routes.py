from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.direct_stock import DirectStock

direct_stock_bp = Blueprint('direct_stock', __name__, url_prefix='/api/direct-stock')

@direct_stock_bp.route('', methods=['GET'])
def get_direct_stock():
    organization = request.args.get('organization', '').strip()
    from_date = request.args.get('from_date', '').strip()
    to_date = request.args.get('to_date', '').strip()

    query = DirectStock.query

    if organization and organization != 'ALL':
        query = query.filter_by(organization=organization)
    if from_date:
        query = query.filter(DirectStock.date >= from_date)
    if to_date:
        query = query.filter(DirectStock.date <= to_date)

    entries = query.order_by(DirectStock.created_at.desc()).all()
    return jsonify({'success': True, 'data': [e.to_dict() for e in entries]}), 200


@direct_stock_bp.route('', methods=['POST'])
def create_direct_stock():
    data = request.get_json() or {}

    product = data.get('product', '').strip()
    vendor = data.get('vendor', '').strip()
    engine_number = data.get('engineNumber', '').strip()
    chassis_number = data.get('chassisNumber', '').strip()
    color = data.get('color', '').strip()

    if not product or not vendor or not engine_number or not chassis_number or not color:
        return jsonify({'success': False, 'message': 'Product, Vendor, Engine Number, Chassis Number and Color are required'}), 400

    entry = DirectStock(
        organization=data.get('organization', 'ROYAL BIKES').strip(),
        date=data.get('date', '').strip(),
        vendor=vendor,
        product=product,
        quantity=int(data.get('quantity', 1)),
        engine_number=engine_number,
        chassis_number=chassis_number,
        color=color,
        notes=data.get('notes', '').strip()
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({'success': True, 'data': entry.to_dict(), 'message': 'Direct Stock entry saved successfully'}), 201


@direct_stock_bp.route('/<int:entry_id>', methods=['DELETE'])
def delete_direct_stock(entry_id):
    entry = DirectStock.query.get_or_404(entry_id)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Direct Stock entry deleted successfully'}), 200
