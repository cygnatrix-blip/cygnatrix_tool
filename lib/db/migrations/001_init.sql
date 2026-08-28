-- Cygnatrix Tools — initial schema.
-- Only persistent data the MVP genuinely needs: analytics events + contact messages.
-- Additive, forward-only migrations. Run with: npm run db:migrate

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    VARCHAR(20) NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event         VARCHAR(40) NOT NULL,
  tool_slug     VARCHAR(60) NULL,
  category      VARCHAR(20) NULL,
  meta          JSON NULL,
  country       CHAR(2) NULL,
  device        VARCHAR(10) NULL,
  referrer_host VARCHAR(120) NULL,
  ip_hash       CHAR(64) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event (event),
  INDEX idx_tool_slug (tool_slug),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  subject    VARCHAR(160) NOT NULL,
  message    TEXT NOT NULL,
  ip_hash    CHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  handled    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_handled (handled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO schema_migrations (version) VALUES ('001')
  ON DUPLICATE KEY UPDATE version = version;
