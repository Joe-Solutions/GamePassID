# GamePassID — deploy (shared EOG / TradeKo EC2 + RDS)

Same host pattern as EOG Backend and TradeKo (`trading_app_backend` / barter): GitHub Actions → SSH → `/var/www/…` → PM2 → nginx + Let’s Encrypt.

| Item | Value |
| --- | --- |
| Public URL | `https://gp-register.joesolutions.ph` |
| EC2 | Shared Joe Solutions box (`13.251.137.7` / `ec2-13-251-137-7.ap-southeast-1.compute.amazonaws.com`) |
| App dir | `/var/www/GamePassID` |
| PM2 name | `gamepassid` |
| App listen | `127.0.0.1:3210` (EOG uses `3000`, barter `2026`, email-service `3010`, …) |
| RDS | Same instance as EOG/TradeKo: `tradeko.chssuuoa2xdc.ap-southeast-1.rds.amazonaws.com:5432` |
| Database name | `gamepassid` (**new** DB on that instance — not `eog` / not TradeKo’s DB) |

---

## 1. Zone editor (`joesolutions.ph`)

Host/DNS provider (Namecheap Advanced DNS or wherever `joesolutions.ph` is managed).

Add or confirm:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| **A** | `gp-register` | `13.251.137.7` | Automatic or 300 |

Notes:

- Full name becomes `gp-register.joesolutions.ph`.
- Do **not** use a CNAME to another `*.joesolutions.ph` name unless that name itself is an A to this EC2; A → `13.251.137.7` matches `api.eog.joesolutions.ph` / `contact-us.api.joesolutions.ph`.
- No need for `www.gp-register` unless you want it (then either a second A or a CNAME to `gp-register`).
- After saving, check: `dig +short gp-register.joesolutions.ph @8.8.8.8` → `13.251.137.7`.

TLS is issued on the server with certbot after nginx is installed (section 4) — you do **not** add ACME TXT records when using `certbot --nginx`.

---

## 2. Create the RDS database (one-time)

Connect as the RDS master (or an admin) used for EOG/TradeKo, then:

```sql
CREATE DATABASE gamepassid;
```

Optional dedicated role (recommended later):

```sql
CREATE USER gamepassid WITH PASSWORD 'generate-a-long-secret';
GRANT ALL PRIVILEGES ON DATABASE gamepassid TO gamepassid;
\c gamepassid
GRANT ALL ON SCHEMA public TO gamepassid;
```

Connection string shape (put real user/password only in the host `.env`, never in git):

```text
DATABASE_URL="postgresql://USER:PASSWORD@tradeko.chssuuoa2xdc.ap-southeast-1.rds.amazonaws.com:5432/gamepassid?schema=public&sslmode=require"
```

Confirm the RDS security group already allows the EC2 SG (same as EOG).

---

## 3. First-time host bootstrap (before first Actions deploy)

SSH to the shared EC2 (same credentials as EOG/TradeKo deploys):

```bash
sudo mkdir -p /var/www/GamePassID
sudo chown -R "$USER:$USER" /var/www/GamePassID
cd /var/www/GamePassID
# After first successful deploy clone, or clone once manually:
# git clone git@github.com:Joe-Solutions/GamePassID.git .

cat > /var/www/GamePassID/.env <<'EOF'
DATABASE_URL="postgresql://USER:PASSWORD@tradeko.chssuuoa2xdc.ap-southeast-1.rds.amazonaws.com:5432/gamepassid?schema=public&sslmode=require"
AUTH_SECRET="paste-a-long-random-string"
NODE_ENV=production
PORT=3210
EOF
chmod 600 /var/www/GamePassID/.env
mkdir -p /var/www/GamePassID/data/uploads/photos
```

`.env` is gitignored and must **survive** deploys (the workflow does not overwrite it).

---

## 4. nginx + TLS (one-time)

```bash
sudo cp /var/www/GamePassID/deploy/nginx-gp-register.joesolutions.ph.conf \
  /etc/nginx/conf.d/gp-register.joesolutions.ph.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d gp-register.joesolutions.ph
```

---

## 5. GitHub Actions secrets / vars

Mirror the EOG / TradeKo (`trading_app_backend`) repo settings on **Joe-Solutions/GamePassID**:

| Name | Kind | Purpose |
| --- | --- | --- |
| `DEPLOY_ENV` | **Variable** | Must be `production` for deploy job to run |
| `AWS_REGION` | Secret | e.g. `ap-southeast-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Secret | SG whitelist for runner SSH |
| `AWS_SG_ID` | Secret | EC2 security group id |
| `HOST_DNS_PRODUCTION` | Secret | EC2 host / DNS used by appleboy SSH |
| `EC2_USER_PRODUCTION` | Secret | SSH user |
| `EC2_SSH_KEY_PRODUCTION` | Secret | Private key |
| `GH_SECRET_KEY` | Secret | PAT for private clone on the box |

Workflows:

- `.github/workflows/ci.yml` — lint + build on PR / push
- `.github/workflows/github-action-ec2.yml` — push `main` → deploy (same SG open/close + PM2 pattern as EOG/barter)

---

## 6. Verify

```bash
curl -fsS http://127.0.0.1:3210/ | head
curl -I https://gp-register.joesolutions.ph
pm2 list   # expect gamepassid online
```

Seed encoders only when intentional:

```bash
cd /var/www/GamePassID && npm run db:seed
```

Demo encoder (change password after first login in production): `encoder` / `encoder123`.
