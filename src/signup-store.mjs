import pg from 'pg';
export async function storeSignup(record, env) {
  // Request-scoped client: never share live sockets across Worker requests.
  const client = new pg.Client({ connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 8000, query_timeout: 8000 });
  try {
    await client.connect();
    // A duplicate is intentionally indistinguishable from a new registration.
    // Preserve first consent, referral attribution and any later suppression.
    await client.query(`insert into private.signups (id, email_hash, encrypted_payload, referral_code)
      values ($1, $2, $3, $4) on conflict do nothing`,
      [record.id, record.emailHash, record.encrypted, record.referralCode]);
  } finally { await client.end(); }
}
