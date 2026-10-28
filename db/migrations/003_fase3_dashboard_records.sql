-- MAPAN · Fase 3 · Data operasional dashboard
-- Aditif: mempertahankan data Fase 1-2 dan menyimpan data yang dibuat dari UI.
SET NAMES utf8mb4;
SET time_zone = '+00:00';

USE mapan;

ALTER TABLE organization_invitations
  ADD COLUMN invitee_name VARCHAR(120) NULL AFTER email;

CREATE TABLE organization_records (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  record_type     ENUM('cycle','task','activity','report','scan','community_post') NOT NULL,
  title           VARCHAR(160) NOT NULL,
  payload         JSON NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'aktif',
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                    ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at      DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY ix_records_org_type_created (organization_id, record_type, created_at),
  KEY ix_records_org_type_status (organization_id, record_type, status, deleted_at),
  CONSTRAINT fk_records_org FOREIGN KEY (organization_id)
    REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='Catatan operasional dashboard per organisasi';
