CREATE TABLE Access (
    ist_number VARCHAR(255) PRIMARY KEY,
    passphrase VARCHAR(64) NULL
);

CREATE TABLE Rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(15)
);

CREATE TABLE Classes(
  class_id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(255)
); 

CREATE TABLE Products (
    product_code VARCHAR(255) PRIMARY KEY,
    product_name VARCHAR(255),
    product_amount INT,
    room_id INT,
    class_id INT,
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id),
    FOREIGN KEY (class_id) REFERENCES Classes(class_id)
);


INSERT INTO Access (ist_number, passphrase)
VALUES
  (430453, 'teste'),
  (430452, 'teste');

INSERT INTO Rooms (room_id, room_name)
VALUES
  (1, 2.24),
  (2, 0.59);

INSERT INTO Classes (class_id, class_name)
VALUES
  (1, 'TESTE1'),
  (2, '59');

INSERT INTO Products (product_code, product_name, product_amount, room_id, class_id)
VALUES 
  (1032131232132, 'Cabos Rede Red', 3, 1, 1),
  ('CZC3298D83', 'ARROXZ','ABOBORA', 1, 2),
  ('201044G010006126', 'werfjo', 2, 2, 2);