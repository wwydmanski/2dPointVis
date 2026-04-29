
#!/usr/bin/env bash
set -euo pipefail

# deploy-prod.sh
# Deploy the application in SSL (production) mode as described in README.md
# Usage: DOMAIN=your.domain EMAIL=you@example.com DATA_WEBSERVER_PATH=/path DATA_PATH=/path ./deploy-prod.sh

print_usage() {
	cat <<EOF
Usage: $0 [--external-port PORT] [--no-sudo]
Environment variables required when using SSL:
	DATA_WEBSERVER_PATH  Path to webserver data (required)
	DATA_PATH            Path to MIP follow-up clusters (required, may be empty directory)
	DOMAIN               Domain name for TLS certificate (required when USE_SSL=1)
	EMAIL                Email for certbot (required when USE_SSL=1)

Optional environment variables:
	EXTERNAL_PORT        External port (defaults to 8081)
	USE_SSL              Set to 1 to enable SSL (defaults to 1)

This script will build frontend artifacts, ensure TLS certificates exist (attempts certbot if missing), and start the docker compose stack.
EOF
}

# Defaults
: "${EXTERNAL_PORT:=8081}"
: "${USE_SSL:=1}"

# Parse args
USE_SUDO=1
while [[ $# -gt 0 ]]; do
	case "$1" in
		--external-port)
			EXTERNAL_PORT="$2"; shift 2;;
		--no-sudo)
			USE_SUDO=0; shift;;
		-h|--help)
			print_usage; exit 0;;
		*)
			echo "Unknown arg: $1" >&2; print_usage; exit 2;;
	esac
done

if [[ -z "${DATA_WEBSERVER_PATH-}" ]]; then
	echo "ERROR: DATA_WEBSERVER_PATH is not set." >&2
	print_usage
	exit 2
fi

if [[ -z "${DATA_PATH-}" ]]; then
	echo "ERROR: DATA_PATH is not set." >&2
	print_usage
	exit 2
fi

if [[ "$USE_SSL" -ne 0 ]]; then
	if [[ -z "${DOMAIN-}" ]]; then
		echo "ERROR: DOMAIN must be set when USE_SSL=1." >&2
		print_usage
		exit 2
	fi
	if [[ -z "${EMAIL-}" ]]; then
		echo "ERROR: EMAIL must be set when USE_SSL=1." >&2
		print_usage
		exit 2
	fi
fi

echo "Deploying in SSL (production) mode"
echo "  DATA_WEBSERVER_PATH=$DATA_WEBSERVER_PATH"
echo "  DATA_PATH=$DATA_PATH"
echo "  EXTERNAL_PORT=$EXTERNAL_PORT"
echo "  USE_SSL=$USE_SSL"
if [[ "$USE_SSL" -ne 0 ]]; then
	echo "  DOMAIN=$DOMAIN"
	echo "  EMAIL=$EMAIL"
fi

# Build frontend
echo "\n==> Building frontend..."
if [[ -d frontend ]]; then
	if [[ -f frontend/yarn.lock ]]; then
		echo "Using yarn to install and build frontend"
		(cd frontend && yarn install --frozen-lockfile || yarn install)
		(cd frontend && yarn build)
	else
		echo "Using npm to install and build frontend"
		(cd frontend && npm ci)
		(cd frontend && npm run build)
	fi
else
	echo "Warning: frontend directory not found; skipping frontend build." >&2
fi

# Prepare docker compose commands
if [[ $USE_SUDO -eq 1 && $(id -u) -ne 0 ]]; then
	SUDO_CMD=(sudo --preserve-env=DATA_PATH,DATA_WEBSERVER_PATH,EXTERNAL_PORT,USE_SSL,DOMAIN,EMAIL)
else
	SUDO_CMD=()
fi

if [[ "$USE_SSL" -ne 0 ]]; then
	CERT_PREFIX="/etc/letsencrypt/live/$DOMAIN"
	if [[ -d "$CERT_PREFIX" && -f "$CERT_PREFIX/fullchain.pem" && -f "$CERT_PREFIX/privkey.pem" ]]; then
		echo "Found existing certificates at $CERT_PREFIX"
	else
		echo "Certificates not found at $CERT_PREFIX. Attempting to request certificates with certbot."
		if ! command -v certbot >/dev/null 2>&1; then
			echo "certbot not found on PATH. Install certbot, then re-run this script, or place certs at $CERT_PREFIX." >&2
			echo "Refer to README.md for manual certbot instructions." >&2
			exit 2
		fi

		echo "Running certbot to request certificates for $DOMAIN (requires port 80 open and valid DNS)."
		# Run certbot (may require sudo)
		${SUDO_CMD[@]} certbot certonly --webroot -w "$(pwd)/certbot/www" -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

		echo "certbot finished. Verify certificates exist at $CERT_PREFIX before continuing."
		if [[ ! -f "$CERT_PREFIX/fullchain.pem" || ! -f "$CERT_PREFIX/privkey.pem" ]]; then
			echo "Certificate generation failed or certificates not found after certbot run." >&2
			exit 2
		fi
	fi
fi

echo "\n==> Stopping any existing docker compose stack (if running)"
${SUDO_CMD[@]} docker compose down || true

echo "\n==> Starting docker compose (building images)"
${SUDO_CMD[@]} docker compose up --build -d

echo "\nDeployment finished.\n"
echo "Check services with: docker compose ps"
echo "If you used sudo, use: sudo docker compose ps"

