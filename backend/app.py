from flask import Flask, Blueprint, request, jsonify, session, redirect, make_response, url_for, render_template
from flask_cors import CORS
from sqlalchemy import create_engine, text
from flasgger import Swagger, swag_from, LazyJSONEncoder
from functools import wraps
import argparse
import secrets
import json
import os
import hashlib
from flask_bcrypt import Bcrypt, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base
from sqlalchemy import Column, Integer, String, Boolean
import string
import secrets


CONFIG_PATH = ''
#creating app
app = Flask(__name__)
CORS(app)

app.config['JWT_SECRET_KEY'] = 'teste'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 28800
jwt = JWTManager(app)
bcrypt = Bcrypt()

Swagger(app, template_file='../swagger/definitions.yaml')

engine = create_engine("mysql://isaaclana:lilreaper06711@localhost/Scan")


SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

# área para hash
def hash_password(password, salt=None):
    if not salt:
        salt = os.urandom(16)  # Gera um salt aleatório
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)  # Gera o hash da senha
    return salt.hex(), hashed.hex()  # Retorna o salt e o hash da senha

# Função para verificar senha
def verify_password(stored_password, provided_password, salt):
    salt_bytes = bytes.fromhex(salt)  # Converte o salt de volta para bytes
    hashed = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt_bytes, 100000)  # Gera o hash da senha fornecida
    return stored_password == hashed.hex()  # Compara os hashes

# Função para criar uma senha aleatória (se não fornecida)
def generate_random_password(length=28):
    alphabet = string.ascii_letters + string.digits  # Caracteres permitidos para a senha
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# ===================================== PRODUCTS ======================================= #

#GET PRODUCTS
@app.route('/products', methods=['GET'])
@swag_from('../swagger/getProducts.yaml')
def get_products():
    query = text("""
    SELECT 
        Products.*,
        Rooms.room_name
    FROM Products
    JOIN Rooms ON Products.room_id = Rooms.room_id
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
                    'room_name': row[5],
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
    room_name = data.get('room_name')

    if not product_name or not product_code or not product_class or not room_name:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400

    try:
        with engine.begin() as con:
            query_check = text("SELECT * FROM Products WHERE product_code = :product_code")
            result = con.execute(query_check, {'product_code': product_code}).fetchone()

            if result:
                return jsonify({'message': 'Este produto já existe'}), 409

            query_room = text("SELECT room_id FROM Rooms WHERE room_name = :room_name")
            room_result = con.execute(query_room, {'room_name': room_name}).fetchone()

            if not room_result:
                return jsonify({'message': 'Sala não encontrada'}), 404
            
            room_id = room_result[0]

            query_insert = text("""
                INSERT INTO Products (product_code, product_name, product_class, product_amount, room_id)
                VALUES (:product_code, :product_name, :product_class, :product_amount, :room_id)
            """)

            con.execute(query_insert, {
                'product_amount': product_amount, 'product_code': product_code, 'product_name': product_name, 'product_class': product_class, 'room_id': room_id
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
        room_name = data.get('room_name')
        
        if not product_name and not product_class and not product_amount or not room_name:
            return jsonify({'message': 'Por favor adicione pelo menos um campo para mudar'}), 400
        
        query = text("SELECT * FROM Products WHERE product_code =  :product_code ;").bindparams(product_code=product_code)
        if  con.execute(query).fetchone() is None:
            return jsonify({'message': 'Produto não encontrado'}), 404
        
        query_room = text("SELECT room_id FROM Rooms WHERE room_name = :room_name")
        room_result = con.execute(query_room, {'room_name': room_name}).fetchone()

        if not room_result:
            return jsonify({'message': 'Sala não encontrada'}), 404
        
        room_id = room_result[0]
        
        update = text("UPDATE Products SET product_name = :product_name, product_class = :product_class, product_amount = :product_amount, room_id = :room_id WHERE product_code = :product_code ;").bindparams(product_name=product_name, product_class=product_class, product_amount=product_amount, room_id=room_id,product_code=product_code)

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

#PUT ROOMS
@app.route('/room', methods=['PUT'])
@swag_from('../swagger/putRoom.yaml')
def update_room():
    with engine.connect() as con:
        data = request.get_json()
        old_room_name = data.get('old_room_name')
        new_room_name = data.get('room_name')

        if not old_room_name or not new_room_name:
            return jsonify({'message': 'Nome antigo e novo são obrigatórios.'}), 400

        query = text("SELECT * FROM Rooms WHERE room_name = :old_room_name").bindparams(old_room_name=old_room_name)
        if con.execute(query).fetchone() is None:
            return jsonify({'message': 'Sala original não encontrada.'}), 404

        check_new_name = text("SELECT * FROM Rooms WHERE room_name = :new_room_name").bindparams(new_room_name=new_room_name)
        if con.execute(check_new_name).fetchone():
            return jsonify({'message': 'Já existe uma sala com esse nome.'}), 409

        update = text("UPDATE Rooms SET room_name = :new_room_name WHERE room_name = :old_room_name") \
            .bindparams(new_room_name=new_room_name, old_room_name=old_room_name)

        con.execute(update)
        con.commit()

    return jsonify({'message': 'Sala atualizada com sucesso!'}), 200


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

    
# POST USERS
@app.route('/user', methods=['POST'])
def add_user():
    data = request.json

    ist_number = data.get('ist_number')
    passphrase = data.get('passphrase')  # Senha fornecida pelo usuário (pode ser vazia)

    if not ist_number:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400  # Caso o número IST não seja fornecido

    salt = None
    hashed_password = None

    if passphrase:
        # Se uma senha foi fornecida, gera o hash dela
        salt, hashed_password = hash_password(passphrase)  # Gera o salt e o hash da senha
    else:
        # Caso não tenha senha fornecida, gera uma senha aleatória
        alphabet = string.ascii_letters + string.digits
        passphrase = ''.join(secrets.choice(alphabet) for _ in range(28))  # Gera uma senha aleatória
        salt, hashed_password = hash_password(passphrase)  # Gera o hash dessa senha aleatória

    try:
        with engine.begin() as con:
            # Verifica se o usuário já existe
            query_check = text("SELECT * FROM Access WHERE ist_number = :ist_number")
            result = con.execute(query_check, {'ist_number': ist_number}).fetchone()

            if result:
                return jsonify({'message': 'O Utilizador já tem acesso'}), 409  # Caso o usuário já exista

            # Insere o novo usuário no banco de dados
            query_insert = text("""
                INSERT INTO Access (ist_number, passphrase, salt)
                VALUES (:ist_number, :passphrase, :salt)
            """)

            con.execute(query_insert, {
                'ist_number': ist_number,
                'passphrase': hashed_password,  # Armazena o hash da senha
                'salt': salt  # Armazena o salt da senha
            })

        return jsonify({'message': 'Utilizador adicionado com sucesso!'}), 201  # Retorna o sucesso da criação do usuário

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
                query = text("""
                SELECT Products.*, Rooms.room_name
                FROM Products
                JOIN Rooms ON Products.room_id = Rooms.room_id
                WHERE Products.product_code = :code
                """)
                result = con.execute(query, {"code": product_code})
                row = result.fetchone()

                if row:
                    produto = {
                        'product_code': row[0],
                        'product_name': row[1],
                        'product_class': row[2],
                        'product_amount': row[3],
                        'room_name': row[5],
                    }
                    return jsonify(produto), 200
                else:
                    return jsonify({'error': 'Produto não encontrado'}), 404

            else:
                query = text("""SELECT Products.*, Rooms.room_name
                FROM Products
                JOIN Rooms ON Products.room_id = Rooms.room_id """)
                result = con.execute(query)

                products = []
                for row in result:
                    products.append({
                        'product_code': row[0],
                        'product_name': row[1],
                        'product_class': row[2],
                        'product_amount': row[3],
                        'room_name': row[5],
                    })
                return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#PUT PRODUCTS?BY?SCAN
@app.route
@app.route('/products_scan', methods=['PUT'])
def put_products_scan():
     with engine.connect() as con:
        data = request.get_json()
        product_amount = data.get('product_amount', None)
        product_code = data.get('product_code')
        room_name = data.get('room_name')
        
        if not product_amount or not room_name:
            return jsonify({'message': 'Por favor altere um dos campos para avançar'}), 400
        
        query = text("SELECT * FROM Products WHERE product_code =  :product_code ;").bindparams(product_code=product_code)
        if  con.execute(query).fetchone() is None:
            return jsonify({'message': 'Produto não encontrado'}), 404
        
        query_room = text("SELECT room_id FROM Rooms WHERE room_name = :room_name")
        room_result = con.execute(query_room, {'room_name': room_name}).fetchone()

        if not room_result:
            return jsonify({'message': 'Sala não encontrada'}), 404
        
        room_id = room_result[0]

        update = text("UPDATE Products SET product_amount = :product_amount, room_id = :room_id WHERE product_code = :product_code ;").bindparams(product_amount=product_amount, room_id=room_id,product_code=product_code)

        con.execute(update)
        con.commit()
        
     return jsonify({'message': 'Produto atualizado!'}), 200

######################################################################## LOGIN ######################################################################## 
Base.metadata.create_all(engine)
    
class Access(Base):
    __tablename__ = 'Access'
    ist_number = Column(String, primary_key=True)
    passphrase = Column(String, nullable=True)
    salt = Column(String, nullable=True)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    ist_number = data.get('ist_number')
    passphrase = data.get('passphrase')

    if not ist_number or not passphrase:
        return jsonify({'message': 'IST Number e Senha são obrigatórios'}), 400  # Se a senha ou o IST Number não for fornecido

    try:
        with engine.connect() as con:
            query = text("SELECT * FROM Access WHERE ist_number = :ist_number")
            user = con.execute(query, {'ist_number': ist_number}).fetchone()

            if not user:
                return jsonify({'message': 'Utilizador não encontrado'}), 404  # Caso o usuário não exista

            stored_password = user[1]
            salt = user[2]

            if not stored_password or not salt:
                return jsonify({'message': 'Usuário não tem senha definida'}), 401  # Se não houver senha ou salt, login não permitido

            # Verifica se a senha fornecida é válida
            if verify_password(stored_password, passphrase, salt):  
                access_token = create_access_token(identity=ist_number)
                return jsonify({'message': 'Login bem-sucedido', 'access_token': access_token}), 200
            else:
                return jsonify({'message': 'Senha incorreta'}), 401  # Senha incorreta

    except Exception as e:
        print(f"Erro no login: {e}")
        return jsonify({'error': str(e)}), 500  # Caso ocorra algum erro



        

# Rota protegida para obter informações do Utilizador
#functionality check:  tested passes
@app.route('/Users', methods=['GET'])
@jwt_required()
def userinfo():
    current_user_id = get_jwt_identity()
    with SessionLocal() as session:
        access = session.query(Access).filter_by(ist_number=current_user_id).first()

        if not access:
            return jsonify({'message': 'Utilizador não encontrado'}), 404

        return jsonify({'Access': {'ist_number': access.ist_number}}), 200


# ===================================== ROUTE ======================================= #   
    
@app.route('/')
def root():
    return jsonify({'message': 'Hello World!'})