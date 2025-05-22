CREATE TABLE Access (
    ist_number VARCHAR(255) PRIMARY KEY,
    passphrase VARCHAR(64) NULL
);

CREATE TABLE Rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(15)
);

CREATE TABLE Products (
    product_code VARCHAR(255) PRIMARY KEY,
    product_name VARCHAR(255),
    product_class VARCHAR(50),
    product_amount INT,
    room_id INT,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id)
);


INSERT INTO Access (ist_number, passphrase)
VALUES
  (430453, 'teste'),
  (430452, 'teste');

INSERT INTO Rooms (room_id, room_name)
VALUES
  (1, 2.24),
  (2, 0.59);

INSERT INTO Products (product_code, product_name, product_class, product_amount, room_id)
VALUES 
  (1032131232132, 'Cabos Rede Red', 'ms', 3, 1),
  ('CZC3298D83', 'ARROXZ','ABOBORA', 1, 1),
  ('201044G010006126', 'werfjo', 'arroz', 2, 2);