CREATE TABLE Products (
    product_code VARCHAR(255) PRIMARY KEY,
    product_name VARCHAR(255),
    product_class VARCHAR(50),
    product_amount INT
);

CREATE TABLE Access (
    ist_number VARCHAR(255) PRIMARY KEY
);

CREATE TABLE Rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(15)
);

INSERT INTO Products (product_code, product_name, product_class, product_amount)
VALUES 
  (1032131232132, 'Cabos Rede Red', 'ms', 3),
  ('CZC3298D83', 'ARROXZ','ABOBORA', 1),
  ('201044G010006126', 'werfjo', 'arroz', 2);

INSERT INTO Access (ist_number)
VALUES
  (430453),
  (430452);

INSERT INTO Rooms (room_id, room_name)
VALUES
  (1, 2.24),
  (2, 0.59);