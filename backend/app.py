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

engine = create_engine("mysql://isaaclana:lilreaper06711@localhost/Scan")
    
# ===================================== PRODUCTS ======================================= #

@app.route('/products', methods=['GET'])
def get_products():
    query = text("""
    SELECT 
        * FROM Products
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

@app.route('/products', methods=['DELETE'])
def delete_products():
    product_name = request.args.get('product_name')

    if not product_name:
        return jsonify({'message': 'Por favor adicione o Nome do Produto'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Products WHERE product_name = :product_name")
            result = con.execute(query_check, {'product_name': product_name}).fetchone()

            if not result:
                return jsonify({'message': 'Produto não encontrado'}), 404

            query_delete = text("DELETE FROM Products WHERE product_name = :product_name")
            con.execute(query_delete, {'product_name': product_name})

        return jsonify({'message': 'Produto deletado com sucesso!'}), 200

    except Exception as e:
        print("Erro ao deletar produto:", e)
        return jsonify({'error': str(e)}), 500

# ===================================== ROUTE ======================================= #   
    
@app.route('/')
def root():
    return jsonify({'message': 'Hello World!'})