CREATE TABLE Products (
    product_id AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255),
    product_code VARCHAR(255),
    product_class VARCHAR(50)
);

CREATE TABLE Access (
    ist_number VARCHAR(255),
);

CREATE TABLE Rooms (
    room_id AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(15)
);