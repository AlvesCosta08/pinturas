FROM node:18-alpine

WORKDIR /app

# Copia package.json do backend
COPY backend/package*.json ./

# Instala dependências
RUN npm install --production

# Copia o código do backend
COPY backend/ ./

# Copia os arquivos estáticos (site) para dentro do app
COPY public/ ./public/

EXPOSE 3000

CMD ["npm", "start"]