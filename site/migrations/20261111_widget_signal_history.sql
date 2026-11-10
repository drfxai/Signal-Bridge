-- On-demand widget history reads stay tenant- and source-indexed.
CREATE INDEX IF NOT EXISTS idx_commands_tenant_source_time
 ON commands(tenant_id,source_type,created_at DESC,id DESC);
