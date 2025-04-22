from flask import Flask, Blueprint, request, jsonify, session, redirect, make_response, url_for, render_template
from flask_cors import CORS
from sqlalchemy import create_engine, text
from flasgger import Swagger, swag_from, LazyJSONEncoder
from functools import wraps
import argparse
import secrets
import json
import os

CONFIG_PATH = ''
#creating app
app = Flask(__name__)
CORS(app)

engine = create_engine("mysql://diogo123:diogo123@localhost/Scan")

@app.route('/geral', methods=['GET'])
def get_geral():
    query = text("""
        SELECT
            p.product_id AS product_id,
            p.product_name AS product_name,
            p.amount AS amount,
            p.category AS category
        FROM
            Products p
    """)

    try:
        with engine.connect() as con:
            result = con.execute(query)
            geral = []

            for row in result:
                geral.append({
                    'product_id': row[0],
                    'product_name': row[1],
                    'amount': row[2],
                    'category': row[3],
                })

        return jsonify(geral), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ===================================== PRODUCTS ======================================= #

@app.route('/products', methods=['GET'])
def get_products():
    query = text("""
    SELECT 
        ALL FROM Products
     """)
    
    try:
        with engine.connect() as con: 
            result = con.execute(query)
            products = []

            for row in result:
                products.append({
                    'product_id': row[0],
                    'product_name': row[1],
                    'product_code': row[2],
                    'product_class': row[3],
                })

        return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ===================================== ROUTE ======================================= #   
    
@app.route('/')
def root():
    return jsonify({'message': 'Hello World!'})