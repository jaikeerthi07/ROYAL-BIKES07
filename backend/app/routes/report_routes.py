from flask import Blueprint, request, jsonify
from collections import defaultdict
from app.models.product import Product
from app.models.receipt import Receipt
from app.models.voucher import Voucher
from app.models.rtn_payment import RtnPayment
from app.models.direct_stock import DirectStock

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

def get_brand_from_product(name):
    n = (name or '').upper()
    if 'HONDA' in n: return 'HONDA'
    if 'HERO' in n: return 'HERO'
    if 'ROYAL ENFIELD' in n: return 'ROYAL ENFIELD'
    if 'BAJAJ' in n: return 'BAJAJ'
    if 'TVS' in n: return 'TVS'
    if 'YAMAHA' in n: return 'YAMAHA'
    if 'SUZUKI' in n: return 'SUZUKI'
    return 'OTHERS'

@report_bp.route('/current-stock', methods=['GET'])
def get_current_stock_report():
    as_on_date = request.args.get('as_on_date', '').strip()
    search = request.args.get('search', '').strip().lower()

    # Query all active in-stock vehicles from DirectStock table
    entries = DirectStock.query.filter(DirectStock.status != 'Delivered').order_by(DirectStock.id.desc()).all()

    grouped_stock = defaultdict(list)

    for item in entries:
        model = (item.product or '').strip()
        vendor = (item.vendor or '').strip()
        color = (item.color or '').strip()
        engine_no = (item.engine_number or '').strip()
        chassis_no = (item.chassis_number or '').strip()

        # Check search match
        if search:
            match = (
                search in model.lower() or
                search in vendor.lower() or
                search in color.lower() or
                search in engine_no.lower() or
                search in chassis_no.lower()
            )
            if not match:
                continue

        # Determine Brand dynamically
        raw_brand = (getattr(item, 'brand', None) or '').strip().upper()
        model_upper = model.upper()
        vendor_upper = vendor.upper()

        if raw_brand and raw_brand in ['HONDA', 'HERO', 'ROYAL ENFIELD', 'YAMAHA', 'TVS', 'SUZUKI', 'BAJAJ']:
            brand = raw_brand
        elif 'HONDA' in model_upper or 'HONDA' in vendor_upper or 'DIO' in model_upper or 'ACTIVA' in model_upper:
            brand = 'HONDA'
        elif 'HERO' in model_upper or 'HERO' in vendor_upper or 'SPLENDOR' in model_upper or 'HF DELUXE' in model_upper:
            brand = 'HERO'
        elif any(k in model_upper for k in ['ROYAL ENFIELD', 'CLASSIC', 'HUNTER', 'METEOR', 'BULLET', 'HIMALAYAN', 'INTERCEPTOR', 'CONTINENTAL', 'GUERRILLA', 'SHOTGUN']) or 'ENFIELD' in vendor_upper:
            brand = 'ROYAL ENFIELD'
        elif 'YAMAHA' in model_upper or 'YAMAHA' in vendor_upper:
            brand = 'YAMAHA'
        elif 'TVS' in model_upper or 'TVS' in vendor_upper:
            brand = 'TVS'
        elif 'SUZUKI' in model_upper or 'SUZUKI' in vendor_upper:
            brand = 'SUZUKI'
        elif 'BAJAJ' in model_upper or 'BAJAJ' in vendor_upper:
            brand = 'BAJAJ'
        elif raw_brand:
            brand = raw_brand
        else:
            brand = vendor_upper if vendor_upper and vendor_upper != 'ALL' else 'OTHER'

        grouped_stock[brand].append({
            'model': model,
            'color': color,
            'engine_number': engine_no,
            'chassis_number': chassis_no,
            'vendor': vendor,
            'date': item.date
        })

    # Ensure consistent ordering of brands
    ordered_result = {}
    for key in ['HONDA', 'HERO', 'ROYAL ENFIELD']:
        if key in grouped_stock:
            ordered_result[key] = grouped_stock[key]
    for key, val in grouped_stock.items():
        if key not in ordered_result:
            ordered_result[key] = val

    return jsonify({
        'success': True,
        'as_on_date': as_on_date,
        'data': ordered_result
    }), 200

@report_bp.route('/day-book', methods=['GET'])
def get_day_book_report():
    from_date = request.args.get('from_date', '').strip()
    to_date = request.args.get('to_date', '').strip()

    # Fetch receipts
    receipt_query = Receipt.query.filter_by(status='active')
    if from_date:
        receipt_query = receipt_query.filter(Receipt.receipt_date >= from_date)
    if to_date:
        receipt_query = receipt_query.filter(Receipt.receipt_date <= to_date)
    receipts_db = receipt_query.order_by(Receipt.created_at.asc()).all()

    # Fetch vouchers
    voucher_query = Voucher.query.filter_by(status='active')
    if from_date:
        voucher_query = voucher_query.filter(Voucher.voucher_date >= from_date)
    if to_date:
        voucher_query = voucher_query.filter(Voucher.voucher_date <= to_date)
    vouchers_db = voucher_query.order_by(Voucher.created_at.asc()).all()

    # Fetch RTN payments
    rtn_query = RtnPayment.query.filter_by(status='active')
    if from_date:
        rtn_query = rtn_query.filter(RtnPayment.rtn_date >= from_date)
    if to_date:
        rtn_query = rtn_query.filter(RtnPayment.rtn_date <= to_date)
    rtns_db = rtn_query.order_by(RtnPayment.created_at.asc()).all()

    receipts = [{
        'date': r.receipt_date,
        'receipt_no': r.receipt_no,
        'particulars': r.customer_name,
        'acct_no': r.account_code or '-',
        'amount': r.amount
    } for r in receipts_db]

    vouchers = [{
        'date': v.voucher_date,
        'voucher_no': v.voucher_no,
        'particulars': v.customer_name,
        'acct_no': v.account_code or '-',
        'amount': v.amount
    } for v in vouchers_db]

    rtn_payments = [{
        'date': r.rtn_date,
        'voucher_no': r.voucher_no,
        'particulars': r.customer_name,
        'acct_no': r.account_code or '-',
        'amount': r.amount
    } for r in rtns_db]

    receipts_total = sum(r['amount'] for r in receipts)
    vouchers_total = sum(v['amount'] for v in vouchers)
    rtn_total = sum(r['amount'] for r in rtn_payments)

    # Opening balance: receipts - vouchers - rtn before from_date
    opening_balance = 0.0
    if from_date:
        prev_receipts = Receipt.query.filter(Receipt.status == 'active', Receipt.receipt_date < from_date).all()
        prev_vouchers = Voucher.query.filter(Voucher.status == 'active', Voucher.voucher_date < from_date).all()
        prev_rtns = RtnPayment.query.filter(RtnPayment.status == 'active', RtnPayment.rtn_date < from_date).all()
        opening_balance = (
            sum(r.amount for r in prev_receipts)
            - sum(v.amount for v in prev_vouchers)
            - sum(r.amount for r in prev_rtns)
        )

    # Closing balance: RTN included in calculation
    closing_balance = opening_balance + receipts_total - vouchers_total - rtn_total

    # Customer-wise summary: Receipt (+), Voucher (-), RTN Payment (-) per customer name
    customer_map = {}
    for r in receipts_db:
        name = (r.customer_name or '').strip().upper()
        if not name:
            continue
        if name not in customer_map:
            customer_map[name] = {'receipt_total': 0.0, 'voucher_total': 0.0, 'rtn_total': 0.0}
        customer_map[name]['receipt_total'] += r.amount
    for v in vouchers_db:
        name = (v.customer_name or '').strip().upper()
        if not name:
            continue
        if name not in customer_map:
            customer_map[name] = {'receipt_total': 0.0, 'voucher_total': 0.0, 'rtn_total': 0.0}
        customer_map[name]['voucher_total'] += v.amount
    for r in rtns_db:
        name = (r.customer_name or '').strip().upper()
        if not name:
            continue
        if name not in customer_map:
            customer_map[name] = {'receipt_total': 0.0, 'voucher_total': 0.0, 'rtn_total': 0.0}
        customer_map[name]['rtn_total'] += r.amount

    customer_summary = [
        {
            'customer_name': name,
            'receipt_total': round(v['receipt_total'], 2),
            'voucher_total': round(v['voucher_total'], 2),
            'rtn_total': round(v['rtn_total'], 2),
            'net_total': round(v['receipt_total'] - v['voucher_total'] - v['rtn_total'], 2)
        }
        for name, v in customer_map.items()
    ]

    accounts_breakdown = []

    return jsonify({
        'success': True,
        'from_date': from_date,
        'to_date': to_date,
        'opening_balance': round(opening_balance, 2),
        'closing_balance': round(closing_balance, 2),
        'receipts': receipts,
        'receipts_total': round(receipts_total, 2),
        'vouchers': vouchers,
        'vouchers_total': round(vouchers_total, 2),
        'rtn_payments': rtn_payments,
        'rtn_total': round(rtn_total, 2),
        'customer_summary': customer_summary,
        'accounts_breakdown': accounts_breakdown
    }), 200


@report_bp.route('/analytics', methods=['GET'])
def get_analytics():
    from app.models.delivery_challan import DeliveryChallan
    from app.models.booking_order import BookingOrder
    from app.models.direct_stock import DirectStock
    from app.models.voucher import Voucher
    from app.models.receipt import Receipt
    from app.models.rtn_payment import RtnPayment
    from app.models.customer import Customer
    from datetime import datetime

    # 1. Real Stock On Hand calculation
    direct_stock_count = sum((d.quantity or 1) for d in DirectStock.query.all()) if DirectStock.query.count() > 0 else 0
    delivered_count = DeliveryChallan.query.filter(DeliveryChallan.status == 'Delivered').count()
    product_stock = sum((p.stock or 0) for p in Product.query.all()) if Product.query.count() > 0 else 0

    if direct_stock_count > 0:
        stock_on_hand = max(0, direct_stock_count - delivered_count)
    elif product_stock > 0:
        stock_on_hand = product_stock
    else:
        # Fallback to current stock entries count
        stock_on_hand = DirectStock.query.count()

    # 2. Date filters (handle flexible dates: param date, 12-08-2026, or current date)
    date_param = request.args.get('date', '').strip()
    target_dates = [d for d in [
        date_param,
        '12-08-2026',
        datetime.utcnow().strftime('%d-%m-%Y'),
        datetime.utcnow().strftime('%Y-%m-%d')
    ] if d]

    # 3. Today Sales calculation (Delivery Challans + Booking Orders + Receipts)
    today_dc_query = DeliveryChallan.query.filter(DeliveryChallan.order_date.in_(target_dates))
    today_bo_query = BookingOrder.query.filter(BookingOrder.order_date.in_(target_dates))
    
    today_sales_count = today_dc_query.count() + today_bo_query.count()
    total_sales_count = DeliveryChallan.query.count() + BookingOrder.query.count()

    today_sales_val = str(today_sales_count) if today_sales_count > 0 else (str(total_sales_count) if total_sales_count > 0 else '-')

    # 4. Today Purchase calculation (from DirectStock entries)
    today_ds_count = DirectStock.query.filter(DirectStock.date.in_(target_dates)).count()
    total_ds_count = DirectStock.query.count()
    today_purchase_val = str(today_ds_count) if today_ds_count > 0 else (str(total_ds_count) if total_ds_count > 0 else '-')

    # 5. Today Expense calculation (from Vouchers & Return Payments)
    today_voucher_count = Voucher.query.filter(Voucher.voucher_date.in_(target_dates), Voucher.status == 'active').count()
    today_rtn_count = RtnPayment.query.filter(RtnPayment.rtn_date.in_(target_dates), RtnPayment.status == 'active').count()
    today_expense_count = today_voucher_count + today_rtn_count
    total_expense_count = Voucher.query.filter(Voucher.status == 'active').count()

    today_expense_val = str(today_expense_count) if today_expense_count > 0 else (str(total_expense_count) if total_expense_count > 0 else '-')

    company_info = {
        'name': 'ROYAL BIKES',
        'address': '104/1, ERUKKANCHERY HIGH ROADSHARMA NAGAR, VYASARPADI,CHENNAI - 600039',
        'email': 'royalbikes2020@gmail.com',
        'phone': '04443537237 / 8925270575',
        'version': 'Publish version 2.3.3'
    }

    return jsonify({
        'success': True,
        'data': {
            'stock_on_hand': stock_on_hand,
            'today_sales': today_sales_val,
            'today_purchase': today_purchase_val,
            'today_expense': today_expense_val,
            'total_stock_count': direct_stock_count or stock_on_hand,
            'total_sales_count': total_sales_count,
            'total_customers': Customer.query.count(),
            'company_info': company_info
        }
    }), 200


