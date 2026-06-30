# Despliegue y flujo de trabajo (combatti-pub)

## Despliegue automático
- El repositorio está conectado a **Cloudflare Pages** (proyecto `combatti-pub`).
- Cualquier cambio que llegue a la rama `main` se despliega automáticamente a **producción** (`combatti-pub.pages.dev`).
- No es necesario (ni posible para el agente) interactuar con el panel de Cloudflare: el despliegue se dispara solo desde GitHub.

## Cómo subir cambios
- **Convención del proyecto: commitear y subir directamente a `main`.**
- El usuario prefiere despliegue directo a producción (sin rama de preview ni Pull Request previo) salvo que indique lo contrario en una tarea concreta.
- Verificar la sintaxis/validez del cambio antes de subir, ya que va directo a producción.

## Estructura del proyecto
- `Restaurante.html` — aplicación completa en un solo archivo (~13.6k líneas): POS/cafetería con login, mesas, delivery, cocina, caja, menú, reportes y cobro.
- `firebase.json` + `firestore.rules` — sincronización en la nube (Firebase/Firestore).
- `netlify.toml`, `_redirects` — configuración de despliegue.
