# Despliegue del backend en AWS (Terraform)

Provisiona una instancia EC2 que **construye y levanta** todo el backend
(gateway + 8 microservicios + pos-bridge + PostgreSQL) con el `docker-compose`
del repositorio. Genera automáticamente un `JWT_SECRET` fuerte y una contraseña
de administrador segura.

> **MVP de un solo nodo.** La base de datos corre como contenedor en la propia
> instancia (con volumen persistente). Para producción con alta durabilidad,
> migra a **RDS PostgreSQL** (ver "Mejoras para producción" abajo).

## Requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- Credenciales de AWS configuradas (`aws configure` o variables de entorno
  `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).

## Uso

```bash
cd platform/infra/aws
cp terraform.tfvars.example terraform.tfvars   # ajusta region, CORS, etc.

terraform init
terraform apply
```

Tras `apply`, Terraform imprime las salidas. Recupera los secretos generados:

```bash
terraform output gateway_url                 # URL del gateway (BACKEND_URL)
terraform output -raw admin_password         # contraseña del admin inicial
terraform output -raw jwt_secret             # secreto JWT en uso
```

> La instancia tarda **varios minutos** tras el `apply` en compilar las 9
> imágenes y arrancar. Verifica con:
> `curl $(terraform output -raw gateway_url)/api/auth/health` → debe responder `UP`.

## Siguientes pasos

1. **Cloudflare Pages:** define la variable de entorno `BACKEND_URL` con el
   valor de `gateway_url` (la función `functions/api/[[path]].js` enruta `/api`
   al backend). Vuelve a desplegar el sitio de Pages.
2. **Migra tus datos:** sigue `platform/tools/legacy-migration/README.md`
   (usa la contraseña de `terraform output -raw admin_password`).
3. **Cambia/rota** la contraseña del admin desde la pantalla de Usuarios.

## Mejoras para producción

- **RDS PostgreSQL** en lugar del contenedor de BD (durabilidad y backups).
- **TLS + dominio** para el gateway (o mantén el proxy de Cloudflare Pages, que
  ya termina TLS en el borde).
- **ECS Fargate / App Runner** por servicio si necesitas escalar de forma
  independiente (este módulo prioriza simplicidad de un solo nodo).
- Restringe el acceso a `/swagger-ui` y a los `actuator` sensibles.

## Destruir

```bash
terraform destroy
```
