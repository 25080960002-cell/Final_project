-- MAPAN · Fase 4 · Sesi autentikasi
SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

CREATE TABLE user_sessions (
  token_hash      CHAR(64) NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  expires_at      DATETIME(6) NOT NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  revoked_at      DATETIME(6) NULL,
  PRIMARY KEY (token_hash),
  KEY ix_sessions_user_expires (user_id, expires_at),
  KEY ix_sessions_org_user (organization_id, user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sessions_org FOREIGN KEY (organization_id)
    REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Token sesi disimpan dalam bentuk hash dan terikat satu organisasi';
