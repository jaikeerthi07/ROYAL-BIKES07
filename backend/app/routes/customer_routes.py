from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.customer import Customer

customer_bp = Blueprint('customers', __name__, url_prefix='/api/customers')

@customer_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_customers():
    search = request.args.get('search')
    status = request.args.get('status')

    query = Customer.query
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%")) |
            (Customer.phone.ilike(f"%{search}%"))
        )

    customers = query.order_by(Customer.created_at.desc()).all()
    return jsonify({'success': True, 'data': [c.to_dict() for c in customers], 'message': 'Customers fetched successfully'}), 200


@customer_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required(optional=True)
def get_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'success': False, 'message': 'Customer not found'}), 404
    return jsonify({'success': True, 'data': customer.to_dict(), 'message': 'Customer details fetched'}), 200


@customer_bp.route('', methods=['POST'])
@jwt_required(optional=True)
def create_customer():
    data = request.get_json() or {}
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    name = data.get('name', '').strip()
    
    if not name:
        name = f"{first_name} {last_name}".strip()

    phone = (data.get('phone') or data.get('phone_number') or '').strip()

    if not name or not phone:
        return jsonify({'success': False, 'message': 'First Name / Name and Phone Number are required'}), 400

    email = data.get('email', '').strip() or None
    if email and Customer.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Customer with this email already exists'}), 400

    account_code = data.get('account_code', '').strip() or None
    if account_code and Customer.query.filter_by(account_code=account_code).first():
        return jsonify({'success': False, 'message': 'Account code already assigned to another customer'}), 400

    # Build address from parts if provided
    address = data.get('address', '').strip()
    if not address:
        addr_parts = [
            data.get('flat_house_no', '').strip(),
            data.get('street_area', '').strip(),
            data.get('landmark', '').strip(),
            data.get('town_city', '').strip(),
            data.get('state', '').strip(),
            data.get('pincode', '').strip()
        ]
        address = ', '.join([p for p in addr_parts if p])

    customer = Customer(
        name=name,
        account_code=account_code,
        email=email,
        phone=phone,
        address=address,
        notes=data.get('notes', '').strip(),
        status=data.get('status', 'active')
    )
    db.session.add(customer)
    db.session.commit()

    return jsonify({'success': True, 'data': customer.to_dict(), 'message': 'Customer created successfully'}), 201




@customer_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'success': False, 'message': 'Customer not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        customer.name = data['name'].strip()
    if 'account_code' in data:
        new_code = data['account_code'].strip() or None
        if new_code:
            existing = Customer.query.filter_by(account_code=new_code).first()
            if existing and existing.id != customer_id:
                return jsonify({'success': False, 'message': 'Account code already assigned to another customer'}), 400
        customer.account_code = new_code
    if 'email' in data:
        customer.email = data['email'].strip() or None
    if 'phone' in data:
        customer.phone = data['phone'].strip()
    if 'address' in data:
        customer.address = data['address'].strip()
    if 'notes' in data:
        customer.notes = data['notes'].strip()
    if 'status' in data:
        customer.status = data['status']

    db.session.commit()
    return jsonify({'success': True, 'data': customer.to_dict(), 'message': 'Customer updated successfully'}), 200


@customer_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'success': False, 'message': 'Customer not found'}), 404

    db.session.delete(customer)
    db.session.commit()
    return jsonify({'success': True, 'data': None, 'message': 'Customer deleted successfully'}), 200
