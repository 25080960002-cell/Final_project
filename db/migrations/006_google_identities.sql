SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

CREATE TABLE google_identities (
  google_sub     VARCHAR(255) NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  email          VARCHAR(160) NOT NULL,
  created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (google_sub),
  UNIQUE KEY uk_google_identity_user (user_id),
  KEY ix_google_identity_email (email),
  CONSTRAINT fk_google_identity_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Akun Google terverifikasi yang ditautkan ke pengguna MAPAN';
