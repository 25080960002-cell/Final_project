-- MAPAN · Fase 5 · Berkas gambar per tenant
SET NAMES utf8mb4;
SET time_zone = '+00:00';
USE mapan;

CREATE TABLE media_objects (
  id              CHAR(36) NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  uploaded_by_id  BIGINT UNSIGNED NOT NULL,
  mime_type       ENUM('image/jpeg','image/png','image/webp') NOT NULL,
  file_size       INT UNSIGNED NOT NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY ix_media_org_created (organization_id, created_at),
  CONSTRAINT fk_media_org FOREIGN KEY (organization_id)
    REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_media_user FOREIGN KEY (uploaded_by_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Metadata berkas gambar tenant; isi berkas disimpan di volume media';
