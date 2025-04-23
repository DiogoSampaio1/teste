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

# ===================================== ROOMS ======================================= #

@app.route('/room', methods=['GET'])
def get_products():
    query = text("""
    SELECT 
        * FROM Rooms
     """)
    
    try:
        with engine.connect() as con: 
            result = con.execute(query)
            products = []

            for row in result:
                products.append({
                    'room_id': row[0],
                    'room_name': row[1],
                })

        return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/room', methods=['DELETE'])
def delete_products():
    room_name = request.args.get('room_name')

    if not room_name:
        return jsonify({'message': 'Por favor adicione o Nome da Sala que deseja eliminar'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Products WHERE room_name = :room_name")
            result = con.execute(query_check, {'room_name': room_name}).fetchone()

            if not result:
                return jsonify({'message': 'Sala não encontrada'}), 404

            query_delete = text("DELETE FROM Products WHERE room_name = :room_name")
            con.execute(query_delete, {'room_name': room_name})

        return jsonify({'message': 'Sala eliminada com sucesso!'}), 200

    except Exception as e:
        print("Erro ao eliminar sala:", e)
        return jsonify({'error': str(e)}), 500

# ===================================== Users ======================================= #

@app.route('/user', methods=['GET'])
def get_products():
    query = text("""
    SELECT 
        * FROM Access
     """)
    
    try:
        with engine.connect() as con: 
            result = con.execute(query)
            products = []

            for row in result:
                products.append({
                    'ist_number': row[0],
                })

        return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user', methods=['DELETE'])
def delete_products():
    ist_number = request.args.get('ist_number')

    if not ist_number:
        return jsonify({'message': 'Por favor adicione o IST Number que deseja retirar o acesso'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Products WHERE ist_number = :ist_number")
            result = con.execute(query_check, {'ist_number': ist_number}).fetchone()

            if not result:
                return jsonify({'message': 'Acesso não encontrado'}), 404

            query_delete = text("DELETE FROM Products WHERE ist_number = :ist_number")
            con.execute(query_delete, {'ist_number': ist_number})

        return jsonify({'message': 'Acesso retirado com sucesso!'}), 200

    except Exception as e:
        print("Erro ao retirar acesso:", e)
        return jsonify({'error': str(e)}), 500
     
# ===================================== ROUTE ======================================= #   
    
@app.route('/')
def root():
    return jsonify({'message': 'Hello World!'})