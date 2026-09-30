# Servi Cerca — Frontend demo

Landing page responsive para conectar personas con prestadores de servicios de su localidad.

## Tecnologías

- React 19
- Next.js 16
- TypeScript
- Tailwind CSS 4
- GSAP
- Lucide Icons

## Funcionalidades incluidas

- Selector de localidades del departamento de Colonia.
- Buscador con autocompletado por servicio.
- Tres prestadores ficticios con calificación, descripción y especialidades.
- Botones de contacto por WhatsApp con mensaje prearmado.
- Formulario demo para registrar nuevos prestadores.
- Tema oscuro predeterminado y tema claro opcional.
- Animaciones GSAP y diseño adaptable a móvil, tablet y escritorio.

## Ejecutar en desarrollo

```bash
pnpm install
pnpm dev
```

También se puede utilizar npm:

```bash
npm install
npm run dev
```

Luego abrí la dirección local que se muestre en la terminal.

## Compilar

```bash
pnpm build
```

Los datos actuales son demostrativos. Las localidades, servicios, profesionales y solicitudes de registro quedaron preparados para conectarse a una API cuando se desarrolle el backend.

El proyecto usa Next.js estándar y no requiere Vite, Vinext, Cloudflare ni Miniflare para ejecutarse localmente.
