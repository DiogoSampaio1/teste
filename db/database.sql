CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255),
    product_code VARCHAR(255),
    product_class VARCHAR(50)
);

CREATE TABLE Access (
    ist_number VARCHAR(255) PRIMARY KEY
);

CREATE TABLE Rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(15)
);

INSERT INTO Products (product_id, product_name, product_code, product_class)
VALUES 
  (1001, 'Cabos Rede Red', 1032131232132, 'ms'),
  (1002, 'Cabos Rede Brancos', 12276523546230, 'ms'),
  (1003, 'Cabos Rede Amarelos', 1005464535340, 'nssss'),
  (1020, 'Cabos Rede Pretos', 545235634634646, 'nao ha');

INSERT INTO Acess (ist_number)
VALUES
  (430453),
  (430452);

INSERT INTO Rooms (room_id, room_name)
VALUES
  (1, 2.24),
  (2, 0.59);