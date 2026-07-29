# Contenedores (Docker) — explicado simple

## ¿Qué es un contenedor y para qué sirve?

Cuando dices "en mi computadora sí funciona" es porque tu máquina ya tiene
Node instalado, la versión correcta, MongoDB corriendo, etc. Un **contenedor**
es como una caja que empaqueta tu aplicación **junto con todo lo que necesita
para correr** (Node, las dependencias, el sistema operativo base) — para que
funcione exactamente igual en tu laptop, en la de tu compañero, o en un
servidor en la nube, sin que nadie tenga que instalar nada manualmente.

- **Imagen**: la "receta" — un archivo (`Dockerfile`) que describe paso a
  paso cómo armar esa caja (qué versión de Node, qué archivos copiar, qué
  comando correr al final).
- **Contenedor**: la caja ya armada y corriendo, a partir de esa receta.
- **Docker Compose**: cuando tu proyecto necesita VARIAS cajas que trabajan
  juntas (aquí: una para la app Node, otra para MongoDB) y quieres levantar
  las dos con un solo comando en vez de una por una.

## Archivos que se agregaron

- **`Dockerfile`** — la receta de la aplicación Node/Express.
- **`docker-compose.yml`** — levanta DOS contenedores juntos: la app y una
  base de datos MongoDB, ya conectados entre sí.
- **`.dockerignore`** — le dice a Docker qué NO copiar dentro de la imagen
  (node_modules, el `.env` real, las fotos ya subidas) para que la imagen
  no pese de más ni se filtren secretos.

## Cómo usarlo (necesitas tener Docker Desktop instalado)

Un solo comando levanta TODO (la app + su base de datos), sin que tengas que
instalar Node, ni MongoDB, ni nada más en tu máquina:

```bash
docker compose up --build
```

- `--build` le dice que arme la imagen desde cero la primera vez (o si
  cambiaste código). Después puedes usar solo `docker compose up`.
- La app queda disponible en `http://localhost:3000`, igual que si la
  hubieras corrido con `npm start`.
- Los datos de MongoDB y las fotos subidas **no se pierden** al apagar los
  contenedores, porque quedan guardados en volúmenes de Docker
  (`mongo_data` y `uploads_data` en el `docker-compose.yml`).

Para apagarlo:

```bash
docker compose down
```

Para apagarlo Y borrar también los datos guardados (empezar de cero):

```bash
docker compose down -v
```

## ¿Por qué esto es "escalar" la aplicación?

Antes, para correr el proyecto en otra máquina o en un servidor, había que
instalar Node, la versión correcta, MongoDB, configurar variables de
entorno a mano, etc. Con el contenedor, ese mismo servidor solo necesita
tener Docker instalado y correr un comando — el resto ya viene empaquetado.
Esto es exactamente lo que hacen por dentro plataformas como Render: reciben
tu código (o directamente tu `Dockerfile`), lo empaquetan en un contenedor,
y lo corren en su infraestructura en la nube.

## Nota para la exposición

Este `Dockerfile` y `docker-compose.yml` se armaron siguiendo la estructura
estándar de la industria para apps Node + MongoDB, y se verificó que el
`docker-compose.yml` es válido (YAML bien formado, servicios `app` y `mongo`
correctamente definidos). No se pudo ejecutar `docker compose up` dentro de
este entorno de desarrollo porque no tiene Docker instalado — pruébalo en tu
laptop antes de exponer, para tener el "screenshot" de que efectivamente
levanta.
