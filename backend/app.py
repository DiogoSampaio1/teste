from flask import Flask, Blueprint, request, jsonify, session, redirect, make_response, url_for, render_template, send_from_directory
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
from datetime import timedelta

CONFIG_PATH = ''
#creating app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*")

BASE_DIR = os.path.abspath(os.path.dirname(__file__)) 
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))
ROOT_HTML = os.path.abspath(os.path.join(BASE_DIR, '..')) 

app.config['JWT_SECRET_KEY'] = 'teste'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 10

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

Swagger(app, template_file='../swagger/definitions.yaml')

engine = create_engine("mysql://Scan:Scan@localhost/Scan")


SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')

def verify_password(stored_password, provided_password):
    return check_password_hash(stored_password, provided_password)


def generate_random_password(length=28):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for _ in range(length))


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token expirado, faça login novamente"}), 401

# ===================================== PRODUCTS ======================================= #

#GET PRODUCTS
@app.route('/products', methods=['GET'])
@swag_from('../swagger/getProducts.yaml')
def get_products():
    query = text("""
    SELECT 
        Products.*,
        Rooms.room_name,
        Classes.class_name
    FROM Products
    JOIN Rooms ON Products.room_id = Rooms.room_id
    JOIN Classes ON Products.class_id = Classes.class_id
     """)
    
    try:
        with engine.connect() as con: 
            result = con.execute(query)
            products = []

            for row in result:
                products.append({
                    'product_id': row[0],
                    'product_code': row[1],
                    'product_name': row[2],
                    'product_amount': row[3],
                    'room_name': row[6],
                    'class_name': row[7],
                })

        return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#POST PRODUCTS
@app.route('/products', methods=['POST'])
@swag_from('../swagger/postProducts.yaml')
def add_product():
    data = request.json

    product_id = data.get('product_id')
    product_code = data.get('product_code')
    product_name = data.get('product_name')
    product_amount = data.get('product_amount')
    room_name = data.get('room_name')
    class_name = data.get('class_name')

    if not product_name or not product_code or not class_name or not room_name:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400

    try:
        with engine.begin() as con:
            query_room = text("SELECT room_id FROM Rooms WHERE room_name = :room_name")
            room_result = con.execute(query_room, {'room_name': room_name}).fetchone()

            if not room_result:
                return jsonify({'message': 'Sala não encontrada'}), 404
            
            query_class = text("SELECT class_id FROM Classes WHERE class_name = :class_name")
            class_result = con.execute(query_class, {'class_name': class_name}).fetchone()

            if not class_result:
                return jsonify({'message': 'Classe não encontrada'}), 404
            
            room_id = room_result[0]
            class_id = class_result[0]

            query_check = text("SELECT product_id FROM Products WHERE room_id = :room_id AND product_code = :product_code")
            result = con.execute(query_check, {'room_id': room_id, 'product_code': product_code}).fetchone()

            if result:
                return jsonify({'message': 'Este produto já está nesta sala'}), 409


            query_insert = text("""
                INSERT INTO Products (product_id, product_code, product_name, product_amount, room_id, class_id)
                VALUES (:product_id, :product_code, :product_name, :product_amount, :room_id, :class_id)
            """)

            con.execute(query_insert, {
                'product_id': product_id,'product_amount': product_amount, 'product_code': product_code, 'product_name': product_name, 'class_id': class_id, 'room_id': room_id
            })

        return jsonify({'message': 'Produto adicionado com sucesso!'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#PUT PRODUCTS
@app.route('/products', methods=['PUT'])
@swag_from('../swagger/putProducts.yaml')
def update_products():
    with engine.connect() as con:
        data = request.get_json()
        product_id = data.get('product_id')
        product_name = data.get('product_name', None)
        product_amount = data.get('product_amount', None)
        product_code = data.get('product_code')
        room_name = data.get('room_name')
        class_name = data.get('class_name')
        
        if not product_name or not class_name and not product_amount or not room_name:
            return jsonify({'message': 'Por favor adicione pelo menos um campo para mudar'}), 400
        
        query = text("SELECT * FROM Products WHERE product_code =  :product_code ;").bindparams(product_code=product_code)
        if  con.execute(query).fetchone() is None:
            return jsonify({'message': 'Produto não encontrado'}), 404
        

        query_class = text("SELECT class_id FROM Classes WHERE class_name = :class_name")
        class_result = con.execute(query_class, {'class_name': class_name}).fetchone()

        if not class_result:
            return jsonify({'message': 'Classe não encontrada'}), 404
        
        query_room = text("SELECT room_id FROM Rooms WHERE room_name = :room_name")
        room_result = con.execute(query_room, {'room_name': room_name}).fetchone()

        if not room_result:
            return jsonify({'message': 'Sala não encontrada'}), 404
        
        room_id = room_result[0]
        class_id = class_result[0]

        query_current = text("SELECT room_id FROM Products WHERE product_id = :product_id")
        current_room = con.execute(query_current, {'product_id': product_id}).fetchone()

        if current_room and current_room[0] != room_id:
            query_check = text("SELECT product_id FROM Products WHERE room_id = :room_id AND product_code = :product_code")
            result = con.execute(query_check, {'room_id': room_id, 'product_code': product_code}).fetchone()

            if result:
                return jsonify({'message': 'Este produto já está nesta sala'}), 409
    
        update = text("UPDATE Products SET product_name = :product_name, product_amount = :product_amount, room_id = :room_id, class_id = :class_id WHERE product_id = :product_id;").bindparams(product_name=product_name, product_amount=product_amount, room_id=room_id,product_id=product_id , class_id=class_id)

        con.execute(update)
        con.commit()
        
    return jsonify({'message': 'Produto atualizado!'}), 200

        
#DELETE PRODUCTS
@app.route('/products', methods=['DELETE'])
@swag_from('../swagger/deleteProducts.yaml')
def delete_products():
    product_code = request.args.get('product_code')
    product_id = request.args.get('product_id')

    if not product_id:
        return jsonify({'message': 'Por favor adicione o código do Produto'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Products WHERE product_id = :product_id")
            result = con.execute(query_check, {'product_id': product_id}).fetchone()

            if not result:
                return jsonify({'message': 'Produto não encontrado'}), 404

            query_delete = text("DELETE FROM Products WHERE product_id = :product_id")
            con.execute(query_delete, {'product_id': product_id})

        return jsonify({'message': 'Produto removido com sucesso!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===================================== CLASSES ======================================= #
#GET CLASSES
@app.route('/class', methods=['GET'])
@swag_from('../swagger/getClasses.yaml')
def get_classes():
    query = text("""
    SELECT 
        * FROM Classes
     """)
    
    try:
        with engine.connect() as con: 
            result = con.execute(query)
            products = []

            for row in result:
                products.append({
                    'class_id': row[0],
                    'class_name': row[1],
                })

        return jsonify(products), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

#POST CLASSES
@app.route('/class', methods=['POST'])
@swag_from('../swagger/postClasses.yaml')
def add_class():
    data = request.json

    class_name = data.get('class_name')

    if not class_name:
        return jsonify({'message': 'Preencha todos os campos obrigatórios'}), 400

    try:
        with engine.begin() as con:
            query_check = text("SELECT * FROM Classes WHERE class_name = :class_name")
            result = con.execute(query_check, {'class_name': class_name}).fetchone()

            if result:
                return jsonify({'message': 'Esta Classe já existe'}), 409

            query_insert = text("""
                INSERT INTO Classes (class_name)
                VALUES (:class_name)
            """)

            con.execute(query_insert, {
                'class_name': class_name
            })

        return jsonify({'message': 'Classe criada com sucesso!'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

#PUT CLASSES
@app.route('/class', methods=['PUT'])
@swag_from('../swagger/putClasses.yaml')
def update_class():
    with engine.connect() as con:
        data = request.get_json()
        old_class_name = data.get('old_class_name')
        new_class_name = data.get('class_name')

        if not old_class_name or not new_class_name:
            return jsonify({'message': 'Nome antigo e o novo são obrigatórios.'}), 400

        query = text("SELECT * FROM Classes WHERE class_name = :old_class_name").bindparams(old_class_name=old_class_name)
        if con.execute(query).fetchone() is None:
            return jsonify({'message': 'Classe original não encontrada.'}), 404

        check_new_name = text("SELECT * FROM Classes WHERE class_name = :new_class_name").bindparams(new_class_name=new_class_name)
        if con.execute(check_new_name).fetchone():
            return jsonify({'message': 'Já existe uma classe com esse nome.'}), 409

        update = text("UPDATE Classes SET class_name = :new_class_name WHERE class_name = :old_class_name") \
            .bindparams(new_class_name=new_class_name, old_class_name=old_class_name)

        con.execute(update)
        con.commit()

    return jsonify({'message': 'Classe atualizada com sucesso!'}), 200


#DELETE CLASSES
@app.route('/class', methods=['DELETE'])
@swag_from('../swagger/deleteClasses.yaml')
def delete_class():
    class_name = request.args.get('class_name')

    if not class_name:
        return jsonify({'message': 'Por favor adicione o Nome da classe que deseja eliminar'}), 400

    try:
        with engine.begin() as con:

            query_check = text("SELECT * FROM Classes WHERE class_name = :class_name")
            result = con.execute(query_check, {'class_name': class_name}).fetchone()

            if not result:
                return jsonify({'message': 'Classe não encontrada'}), 404


            class_id = result[0] 

            query_check_exist = text("SELECT * FROM Products WHERE class_id = :class_id")
            exist = con.execute(query_check_exist, {'class_id': class_id}).fetchone()

            if exist:
                return jsonify({'message': 'A Classe contém produtos, retire os produtos primeiro'}), 400

            query_delete = text("DELETE FROM Classes WHERE class_name = :class_name")
            con.execute(query_delete, {'class_name': class_name})

        return jsonify({'message': 'Classe eliminada com sucesso!'}), 200

    except Exception as e:
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


            room_id = result[0] 

            query_check_exist = text("SELECT * FROM Products WHERE room_id = :room_id")
            exist = con.execute(query_check_exist, {'room_id': room_id}).fetchone()

            if exist:
                return jsonify({'message': 'A sala contém produtos, retire os produtos primeiro'}), 400



            query_delete = text("DELETE FROM Rooms WHERE room_name = :room_name")
            con.execute(query_delete, {'room_name': room_name})

        return jsonify({'message': 'Sala eliminada com sucesso!'}), 200

    except Exception as e:
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
@swag_from('../swagger/postUser.yaml')
def add_user():
    data = request.json

    ist_number = data.get('ist_number')
    passphrase = data.get('passphrase')

    if not ist_number:
        return jsonify({'message': 'O IST Number é obrigatório'}), 400

    if passphrase:
        hashed_password = hash_password(passphrase)
    else:
        passphrase = generate_random_password()
        hashed_password = hash_password(passphrase)

    try:
        with engine.begin() as con:
            query_check = text("SELECT * FROM Access WHERE ist_number = :ist_number")
            result = con.execute(query_check, {'ist_number': ist_number}).fetchone()

            if result:
                return jsonify({'message': 'O Utilizador já tem acesso'}), 409

            query_insert = text("""
                INSERT INTO Access (ist_number, passphrase)
                VALUES (:ist_number, :passphrase)
            """)

            con.execute(query_insert, {
                'ist_number': ist_number,
                'passphrase': hashed_password
            })

        return jsonify({'message': 'Utilizador adicionado com sucesso!', 'passphrase': passphrase}), 201

    except Exception as e:
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
                    SELECT 
                        Products.product_id,
                        Products.product_code,
                        Products.product_name,
                        Products.product_amount,
                        Rooms.room_name,
                        Classes.class_name
                    FROM Products
                    JOIN Rooms ON Products.room_id = Rooms.room_id
                    JOIN Classes ON Products.class_id = Classes.class_id
                    WHERE Products.product_code = :code
                """)
                result = con.execute(query, {"code": product_code}).mappings().all()

                if not result:
                    return jsonify({'error': 'Produto não encontrado'}), 404

                produtos = []
                for row in result:
                    produtos.append({
                        'product_id': row['product_id'],
                        'product_code': row['product_code'],
                        'product_name': row['product_name'],
                        'product_amount': row['product_amount'],
                        'room_name': row['room_name'],
                        'class_name': row['class_name'],
                    })

                return jsonify(produtos), 200

            else:
                query = text("""
                    SELECT 
                        Products.product_id,
                        Products.product_code,
                        Products.product_name,
                        Products.product_amount,
                        Rooms.room_name,
                        Classes.class_name
                    FROM Products
                    JOIN Rooms ON Products.room_id = Rooms.room_id
                    JOIN Classes ON Products.class_id = Classes.class_id
                """)
                result = con.execute(query).mappings().all()

                produtos = []
                for row in result:
                    produtos.append({
                        'product_id': row['product_id'],
                        'product_code': row['product_code'],
                        'product_name': row['product_name'],
                        'product_amount': row['product_amount'],
                        'room_name': row['room_name'],
                        'class_name': row['class_name'],
                    })

                return jsonify(produtos), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
#PUT PRODUCTS?BY?SCAN
@app.route
@app.route('/products_scan', methods=['PUT'])
def put_products_scan():
     
     with engine.connect() as con:
        data = request.get_json()
        product_amount = data.get('product_amount', None)
        product_id = data.get('product_id')
        room_name = data.get('room_name')
        
        if not product_amount or not room_name:
            return jsonify({'message': 'Por favor altere um dos campos para avançar'}), 400
        
        query = text("SELECT * FROM Products WHERE product_id =  :product_id ;").bindparams(product_id=product_id)
        if  con.execute(query).fetchone() is None:
            return jsonify({'message': 'Produto não encontrado'}), 404
        
        query_room = text("SELECT room_id FROM Rooms WHERE room_name = :room_name")
        room_result = con.execute(query_room, {'room_name': room_name}).fetchone()

        if not room_result:
            return jsonify({'message': 'Sala não encontrada'}), 404
        
        room_id = room_result[0]

        update = text("UPDATE Products SET product_amount = :product_amount, room_id = :room_id WHERE product_id = :product_id ;").bindparams(product_amount=product_amount, room_id=room_id,product_id=product_id)

        con.execute(update)
        con.commit()
        
     return jsonify({'message': 'Produto atualizado!'}), 200

######################################################################## LOGIN ######################################################################## 
Base.metadata.create_all(engine)
    
class Access(Base):
    __tablename__ = 'Access'
    ist_number = Column(String, primary_key=True)
    passphrase = Column(String, nullable=True)

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    ist_number = data.get('ist_number')
    passphrase = data.get('passphrase')

    if not ist_number or not passphrase:
        return jsonify({'message': 'IST Number e Senha são obrigatórios'}), 400

    try:
        with engine.connect() as con:
            query = text("SELECT * FROM Access WHERE ist_number = :ist_number")
            user = con.execute(query, {'ist_number': ist_number}).fetchone()

            if not user:
                return jsonify({'message': 'Utilizador não encontrado'}), 404

            stored_password = user[1] 

            if bcrypt.check_password_hash(stored_password, passphrase):
                access_token = create_access_token(identity=ist_number)
                return jsonify({'message': 'Login bem-sucedido', 'ist_number': ist_number,'access_token': access_token}), 200
            else:
                return jsonify({'message': 'Senha incorreta'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500
        

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
def index():
    return send_from_directory(ROOT_HTML, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(file_path):
        return send_from_directory(FRONTEND_DIR, path)
    file_path_root = os.path.join(ROOT_HTML, path)
    if os.path.exists(file_path_root):
        return send_from_directory(ROOT_HTML, path)
    return "Arquivo não encontrado", 404

if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',
        port=8080,
        ssl_context=('2025-05-23_scan.tp.dsi.tecnico.ulisboa.pt_cert.pem', 'privkey.pem')
    )