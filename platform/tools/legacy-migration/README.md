# Migración de datos del POS anterior

Herramientas para llevar los datos del POS anterior (Combatti / `Restaurante.html`,
que guarda todo en `localStorage` del navegador) a la nueva plataforma.

## 1. Exportar (en el navegador del POS viejo)

El POS anterior está alojado en AWS, pero **sus datos viven en el navegador**.
Por eso la exportación se hace desde el mismo navegador donde se usa el POS:

1. Abre `export-legacy-data.html` en el **mismo navegador y dominio** del POS viejo.
   (Puedes subir el archivo a ese mismo sitio, o abrirlo localmente y pegarlo en la
   consola del POS si el dominio es distinto — el `localStorage` es por dominio.)
2. Pulsa **Exportar a JSON** → se descarga `combatti-export.json`.

El archivo contiene las claves `combatti_*`: productos, categorías, mesas,
pedidos, movimientos de caja, usuarios y marca.

## 2. Importar (contra el backend ya desplegado)

Requiere **Node 18+** (usa `fetch` nativo, sin dependencias).

```bash
node import-legacy.mjs \
  --file combatti-export.json \
  --gateway https://api.tu-dominio.com \
  --user admin \
  --password <clave-admin>

# Simulacro (no escribe nada, solo muestra lo que haría):
node import-legacy.mjs --file combatti-export.json --gateway https://api.tu-dominio.com \
  --user admin --password <clave> --dry-run
```

### Qué importa
| Dato del POS viejo | Destino en la plataforma |
|--------------------|--------------------------|
| `combatti_categories` (+ categorías de productos) | `POST /api/catalog/categories` |
| `combatti_products` | `POST /api/catalog/products` (mapea categoría por nombre → id) |
| `combatti_tables` | `POST /api/orders/tables` (posición `x/y/size`, icono) |
| `combatti_brand` | `PUT /api/settings` (nombre, NIT, dirección, teléfono…) |

### Idempotencia
El importador consulta lo que ya existe en el destino y **omite** categorías,
productos y mesas con el mismo nombre. Puedes ejecutarlo varias veces sin duplicar.

### Fuera de alcance (por diseño)
- **Históricos de ventas, pedidos y movimientos de caja**: no se migran; los
  reportes arrancan desde cero en la nueva plataforma.
- **Usuarios y contraseñas**: el esquema de seguridad es distinto (RBAC + hash
  propio). Crea los usuarios desde la pantalla de **Usuarios** de la nueva app.
- `supplies`, `delivery_zones`, `kitchen_tickets`: no tienen equivalente directo.

> El usuario que ejecuta el import debe tener los permisos `catalog.write`,
> `pos.tables` y `settings.manage` (el rol **Administrador** los incluye).
