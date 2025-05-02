USE Scan;

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
  (10, 'ARROXZ', 'CZC3298D83', 'ABOBORA'),
  (23, 'werfjo', '201044G010006126', 'arroz');

INSERT INTO Access (ist_number)
VALUES
  (430453),
  (430452);

INSERT INTO Rooms (room_id, room_name)
VALUES
  (1, 2.24),
  (2, 0.59);