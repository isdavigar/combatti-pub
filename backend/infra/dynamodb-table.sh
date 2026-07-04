#!/bin/bash
# Crea la tabla DynamoDB (Single Table Design) del POS, en modo on-demand
# (PAY_PER_REQUEST) para no salir de la capa gratuita con uso normal.
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
TABLE="${TABLE_NAME:-combatti-pos}"

if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" >/dev/null 2>&1; then
  echo "La tabla '$TABLE' ya existe en $REGION. No se crea de nuevo."
  exit 0
fi

echo "Creando tabla '$TABLE' en $REGION..."
aws dynamodb create-table \
  --table-name "$TABLE" \
  --region "$REGION" \
  --billing-mode PAY_PER_REQUEST \
  --attribute-definitions \
      AttributeName=PK,AttributeType=S \
      AttributeName=SK,AttributeType=S \
  --key-schema \
      AttributeName=PK,KeyType=HASH \
      AttributeName=SK,KeyType=RANGE

echo "Esperando a que la tabla esté activa..."
aws dynamodb wait table-exists --table-name "$TABLE" --region "$REGION"
echo "Tabla '$TABLE' lista."
