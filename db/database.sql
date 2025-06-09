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
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(255),
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
  (2, 0.14),
  (3, 1.13),
  (4, 0.59);

INSERT INTO Classes (class_id, class_name)
VALUES
  (1, 'Cabo Rede 20 Metros'),
  (2, 'PENs'),
  (3, 'Caderno A5'),
  (4, 'USB-C');

INSERT INTO Products (product_id ,product_code, product_name, class_id, room_id, product_amount)
VALUES 
  (1, 5606996121177, 'Caderno Linhas', 3, 2, 21),
  (2, '213926H32729C', 'Cabo Vermelho', 1, 3, 14),
  (3, 'CZC3298D83', 'Pen Ubuntu 22.04.5', 2, 1, 2),
  (4, '201044G010006126', 'Pen Windows 11', 2, 4, 1);