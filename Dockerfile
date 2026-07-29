# ── Imagen base ligera con Node 20 (LTS) ────────────────────────────────────
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero solo los manifiestos de dependencias — así Docker puede
# reusar esta capa en cache si package.json no cambió, y no reinstala todo
# en cada build cuando solo cambia el código.
COPY package*.json ./

# Instala SOLO dependencias de producción (nodemon, por ejemplo, no se
# necesita dentro del contenedor)
RUN npm install --omit=dev

# Ahora sí copiamos el resto del código fuente
COPY . .

# Carpeta donde se guardan las fotos de las ofertas — se crea por si acaso
# no viene en el contexto de build (ver .dockerignore)
RUN mkdir -p public/uploads/offers

# Puerto en el que escucha server.js (debe coincidir con PORT en .env)
EXPOSE 3000

# Node no necesita usuario root para correr un servidor Express
USER node

CMD ["node", "server.js"]
