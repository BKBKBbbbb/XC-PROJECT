-- 数据库：hotel_db

CREATE DATABASE IF NOT EXISTS hotel_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE hotel_db;

-- users 表（用户表）
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20)  NOT NULL DEFAULT 'merchant',
  nickname   VARCHAR(100) DEFAULT '',
  avatar     VARCHAR(500) DEFAULT NULL,
  status     VARCHAR(20)  DEFAULT 'active',
  createdAt  DATETIME     NOT NULL,
  updatedAt  DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- hotels 表（酒店表）
DROP TABLE IF EXISTS hotels;
CREATE TABLE hotels (
  id                 VARCHAR(36)  NOT NULL PRIMARY KEY,
  merchantId         VARCHAR(36)  NOT NULL,
  name               VARCHAR(200) NOT NULL,
  nameEn             VARCHAR(200) DEFAULT NULL,
  city               VARCHAR(50)  DEFAULT NULL,
  address            VARCHAR(500) DEFAULT NULL,
  star               INT          DEFAULT NULL,
  openDate           DATE         DEFAULT NULL,
  phone              VARCHAR(50)  DEFAULT NULL,
  email              VARCHAR(100) DEFAULT NULL,
  contactPerson      VARCHAR(100) DEFAULT NULL,
  description        TEXT         DEFAULT NULL,
  status             VARCHAR(20)  NOT NULL DEFAULT 'pending',
  reviewNote         TEXT         DEFAULT NULL,
  freeParking        TINYINT(1)   DEFAULT 0,
  freeWifi           TINYINT(1)   DEFAULT 0,
  breakfastType      VARCHAR(50)  DEFAULT NULL,
  familyFriendly     TINYINT(1)   DEFAULT 0,
  petsAllowed        TINYINT(1)   DEFAULT 0,
  roomTypes          JSON         DEFAULT NULL,
  nearbyAttractions  JSON         DEFAULT NULL,
  nearbyTransport    JSON         DEFAULT NULL,
  nearbyMalls        JSON         DEFAULT NULL,
  discounts          JSON         DEFAULT NULL,
  customFields       JSON         DEFAULT NULL,
  publishedAt        DATETIME     DEFAULT NULL,
  offlineAt          DATETIME     DEFAULT NULL,
  createdAt          DATETIME     NOT NULL,
  updatedAt          DATETIME     NOT NULL,
  CONSTRAINT fk_hotels_merchant
    FOREIGN KEY (merchantId) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- rooms 表（房型表）
DROP TABLE IF EXISTS rooms;
CREATE TABLE rooms (
  id        VARCHAR(36)  NOT NULL PRIMARY KEY,
  hotelId   VARCHAR(36)  NOT NULL,
  name      VARCHAR(100) NOT NULL,
  price     DECIMAL(10,2) NOT NULL,
  bedType   VARCHAR(50)   DEFAULT '大床/双床',
  capacity  INT           DEFAULT 2,
  stock     INT           DEFAULT 10,
  images    JSON          DEFAULT NULL,
  createdAt DATETIME      NOT NULL,
  updatedAt DATETIME      NOT NULL,
  CONSTRAINT fk_rooms_hotel
    FOREIGN KEY (hotelId) REFERENCES hotels(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- orders 表（订单表）
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  userId      VARCHAR(36)  DEFAULT NULL,
  hotelId     VARCHAR(36)  NOT NULL,
  roomId      VARCHAR(36)  NOT NULL,
  checkIn     DATE         NOT NULL,
  checkOut    DATE         NOT NULL,
  nights      INT          NOT NULL,
  totalPrice  DECIMAL(10,2) NOT NULL,
  guestName   VARCHAR(100) NOT NULL,
  guestPhone  VARCHAR(20)  NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  createdAt   DATETIME     NOT NULL,
  updatedAt   DATETIME     NOT NULL,
  cancelledAt DATETIME     DEFAULT NULL,
  CONSTRAINT fk_orders_user  FOREIGN KEY (userId)  REFERENCES users(id),
  CONSTRAINT fk_orders_hotel FOREIGN KEY (hotelId) REFERENCES hotels(id),
  CONSTRAINT fk_orders_room  FOREIGN KEY (roomId)  REFERENCES rooms(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- comments 表（评论表）
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  hotelId    VARCHAR(36)  NOT NULL,
  userId     VARCHAR(36)  NOT NULL,
  rating     INT          NOT NULL,
  content    TEXT         NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
  reviewNote TEXT         DEFAULT NULL,
  createdAt  DATETIME     NOT NULL,
  updatedAt  DATETIME     NOT NULL,
  CONSTRAINT fk_comments_hotel FOREIGN KEY (hotelId) REFERENCES hotels(id),
  CONSTRAINT fk_comments_user  FOREIGN KEY (userId)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

