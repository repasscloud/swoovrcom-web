import pg from 'pg';
function databaseTLS(env) {
 const url = new URL(env.DATABASE_URL);
 return env.LOCAL_DEVELOPMENT === 'true' && ['127.0.0.1','localhost'].includes(url.hostname) ? false : {rejectUnauthorized:true};
}
export async function storeSignup(record, env) {
  // Request-scoped client: never share live sockets across Worker requests.
  const client = new pg.Client({ connectionString: env.DATABASE_URL,
    ssl: databaseTLS(env), connectionTimeoutMillis: 8000, query_timeout: 8000 });
  try {
    await client.connect();
    // A duplicate is intentionally indistinguishable from a new registration.
    // Preserve first consent, referral attribution and any later suppression.
    await client.query(`insert into private.signups (id, email_hash, encrypted_payload, referral_code)
      values ($1, $2, $3, $4) on conflict do nothing`,
      [record.id, record.emailHash, record.encrypted, record.referralCode]);
  } finally { await client.end(); }
}

export async function storeEnquiry(record, env) {
  const client = new pg.Client({ connectionString: env.DATABASE_URL,
    ssl: databaseTLS(env), connectionTimeoutMillis: 8000, query_timeout: 8000 });
  try {
    await client.connect();
    // Browser retry IDs make a lost acknowledgement safe to retry.
    await client.query(`insert into private.enquiries (id, kind, encrypted_payload)
      values ($1, $2, $3) on conflict do nothing`, [record.id, record.kind, record.encrypted]);
  } finally { await client.end(); }
}
