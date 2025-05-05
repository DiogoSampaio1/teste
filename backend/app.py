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

Swagger(app, template_file='../swagger/definitions.yaml')

engine = create_engine("mysql://isaaclana:lilreaper06711@localhost/Scan")
    
# ===================================== PRODUCTS ======================================= #

#GET PRODUCTS
@app.route('/products', methods=['GET'])
@swag_from('../swagger/getProducts.yaml')
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
                    'product_code': row[0],
                    'product_name': row[1],
                    'product_class': row[2],
                    'product_amount': row[3],
                })

        return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#POST PRODUCTS
@app.route('/products', methods=['POST'])
@swag_from('../swagger/postProducts.yaml')
def add_product():
    data = request.json

    product_code = data.get('product_code')
    product_name = data.get('product_name')
    product_class = data.get('product_class')
    product_amount = data.get('product_amount')

    if not product_name or not product_code or not product_class:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400

    try:
        with engine.begin() as con:
            query_check = text("SELECT * FROM Products WHERE product_code = :product_code")
            result = con.execute(query_check, {'product_code': product_code}).fetchone()

            if result:
                return jsonify({'message': 'Este produto já existe'}), 409

            query_insert = text("""
                INSERT INTO Products (product_code, product_name, product_class, product_amount)
                VALUES (:product_code, :product_name, :product_class, :product_amount)
            """)

            con.execute(query_insert, {
                'product_amount': product_amount, 'product_code': product_code, 'product_name': product_name, 'product_class': product_class
            })

        return jsonify({'message': 'Produto adicionado com sucesso!'}), 201

    except Exception as e:
        print("Erro ao adicionar produto:", e)
        return jsonify({'error': str(e)}), 500
    
#PUT PRODUCTS
@app.route('/products', methods=['PUT'])
@swag_from('../swagger/putProducts.yaml')
def update_products():
    with engine.connect() as con:
        data = request.get_json()
        product_name = data.get('product_name', None)
        product_class = data.get('product_class', None)
        product_amount = data.get('product_amount', None)
        product_code = data.get('product_code')
        
        if not product_name and not product_class and not product_amount:
            return jsonify({'message': 'Por favor adicione pelo menos um campo para mudar'}), 400
        
        query = text("SELECT * FROM Products WHERE product_code =  :product_code ;").bindparams(product_code=product_code)
        if  con.execute(query).fetchone() is None:
            return jsonify({'message': 'Produto não encontrado'}), 404
        
        update = text("UPDATE Products SET product_name = :product_name, product_class = :product_class, product_amount = :product_amount WHERE product_code = :product_code ;").bindparams(product_name=product_name, product_class=product_class, product_amount=product_amount, product_code=product_code)

        con.execute(update)
        con.commit()
        
    return jsonify({'message': 'Produto atualizado!'}), 200

        
#DELETE PRODUCTS
@app.route('/products', methods=['DELETE'])
@swag_from('../swagger/deleteProducts.yaml')
def delete_products():
    product_code = request.args.get('product_code')

    if not product_code:
        return jsonify({'message': 'Por favor adicione o código do Produto'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Products WHERE product_code = :product_code")
            result = con.execute(query_check, {'product_code': product_code}).fetchone()

            if not result:
                return jsonify({'message': 'Produto não encontrado'}), 404

            query_delete = text("DELETE FROM Products WHERE product_code = :product_code")
            con.execute(query_delete, {'product_code': product_code})

        return jsonify({'message': 'Produto removido com sucesso!'}), 200

    except Exception as e:
        print("Erro ao deletar produto:", e)
        return jsonify({'error': str(e)}), 500

# ===================================== ROOMS ======================================= #

#GET ROOMS
@app.route('/room', methods=['GET'])
@swag_from('../swagger/getRoom.yaml')
def get_room():
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
    
#POST ROOMS
@app.route('/room', methods=['POST'])
@swag_from('../swagger/postRoom.yaml')
def add_room():
    data = request.json

    room_name = data.get('room_name')

    if not room_name:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400

    try:
        with engine.begin() as con:
            query_check = text("SELECT * FROM Rooms WHERE room_name = :room_name")
            result = con.execute(query_check, {'room_name': room_name}).fetchone()

            if result:
                return jsonify({'message': 'Esta Sala já existe'}), 409

            query_insert = text("""
                INSERT INTO Rooms (room_name)
                VALUES (:room_name)
            """)

            con.execute(query_insert, {
                'room_name': room_name
            })

        return jsonify({'message': 'Sala criada com sucesso!'}), 201

    except Exception as e:
        print("Erro ao criar sala:", e)
        return jsonify({'error': str(e)}), 500

#DELETE ROOMS
@app.route('/room', methods=['DELETE'])
@swag_from('../swagger/deleteRoom.yaml')
def delete_room():
    room_name = request.args.get('room_name')

    if not room_name:
        return jsonify({'message': 'Por favor adicione o Nome da Sala que deseja eliminar'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Rooms WHERE room_name = :room_name")
            result = con.execute(query_check, {'room_name': room_name}).fetchone()

            if not result:
                return jsonify({'message': 'Sala não encontrada'}), 404

            query_delete = text("DELETE FROM Rooms WHERE room_name = :room_name")
            con.execute(query_delete, {'room_name': room_name})

        return jsonify({'message': 'Sala eliminada com sucesso!'}), 200

    except Exception as e:
        print("Erro ao eliminar sala:", e)
        return jsonify({'error': str(e)}), 500

# ===================================== Users ======================================= #

#GET USERS
@app.route('/user', methods=['GET'])
@swag_from('../swagger/getUser.yaml')
def get_users():
    query = text("""
    SELECT 
        * FROM Access
    """)

    try:
        with engine.connect() as con: 
            result = con.execute(query)
            users = []

            for row in result:
                users.append({
                    'ist_number': row[0],
                })

        return jsonify(users), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
#POST USERS
@app.route('/user', methods=['POST'])
@swag_from('../swagger/postUser.yaml')
def add_user():
    data = request.json

    ist_number = data.get('ist_number')

    if not ist_number:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400

    try:
        with engine.begin() as con:
            query_check = text("SELECT * FROM Access WHERE ist_number = :ist_number")
            result = con.execute(query_check, {'ist_number': ist_number}).fetchone()

            if result:
                return jsonify({'message': 'O Utilizador já tem acesso'}), 409

            query_insert = text("""
                INSERT INTO Access (ist_number)
                VALUES (:ist_number)
            """)

            con.execute(query_insert, {
                'ist_number': ist_number
            })

        return jsonify({'message': 'Utilizador adicionado com sucesso!'}), 201

    except Exception as e:
        print("Erro ao adicionar Utilizador:", e)
        return jsonify({'error': str(e)}), 500
    
#DELETE USERS
@app.route('/user', methods=['DELETE'])
@swag_from('../swagger/deleteUser.yaml')
def delete_users():
    ist_number = request.args.get('ist_number')

    if not ist_number:
        return jsonify({'message': 'Por favor adicione o IST Number que deseja retirar o acesso'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Access WHERE ist_number = :ist_number")
            result = con.execute(query_check, {'ist_number': ist_number}).fetchone()

            if not result:
                return jsonify({'message': 'Acesso não encontrado'}), 404

            query_delete = text("DELETE FROM Access WHERE ist_number = :ist_number")
            con.execute(query_delete, {'ist_number': ist_number})

        return jsonify({'message': 'Acesso retirado com sucesso!'}), 200

    except Exception as e:
        print("Erro ao retirar acesso:", e)
        return jsonify({'error': str(e)}), 500


# ===================================== PRODUCTS?BY?SCAN ======================================= #

# GET PRODUCTS?BY?SCAN
@app.route('/products_scan', methods=['GET'])
def get_products_scan():
    product_code = request.args.get('product_code')

    try:
        with engine.connect() as con:
            if product_code:
                query = text("SELECT * FROM Products WHERE product_code = :code")
                result = con.execute(query, {"code": product_code})
                row = result.fetchone()

                if row:
                    produto = {
                        'product_code': row[0],
                        'product_name': row[1],
                        'product_class': row[2],
                        'product_amount': row[3]
                    }
                    return jsonify(produto), 200
                else:
                    return jsonify({'error': 'Produto não encontrado'}), 404

            else:
                query = text("SELECT * FROM Products")
                result = con.execute(query)

                products = []
                for row in result:
                    products.append({
                        'product_code': row[0],
                        'product_name': row[1],
                        'product_class': row[2],
                        'product_amount': row[3],
                    })
                return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#PUT PRODUCTS?BY?SCAN
@app.route
@app.route('/products_scan', methods=['PUT'])
@swag_from('../swagger/putProducts_scan.yaml')
def put_products_scan():
     with engine.connect() as con:
        data = request.get_json()
        product_amount = data.get('product_amount', None)
        product_code = data.get('product_code')
        
        if not product_amount:
            return jsonify({'message': 'Por favor adicione a quantidade que deseja colocar'}), 400
        
        query = text("SELECT * FROM Products WHERE product_code =  :product_code ;").bindparams(product_code=product_code)
        if  con.execute(query).fetchone() is None:
            return jsonify({'message': 'Produto não encontrado'}), 404
        
        update = text("UPDATE Products SET product_amount = :product_amount WHERE product_code = :product_code ;").bindparams(product_amount=product_amount, product_code=product_code)

        con.execute(update)
        con.commit()
        
     return jsonify({'message': 'Produto atualizado!'}), 200

# ===================================== ROUTE ======================================= #   
    
@app.route('/')
def root():
    return jsonify({'message': 'Hello World!'})