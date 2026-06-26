# Imagem leve do Node.js
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas o package.json primeiro (para cache de dependências)
COPY package*.json ./

# Instala apenas dependências de produção (mais leve)
RUN npm install --production

# Copia o resto do código
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Define variável de ambiente para produção
ENV NODE_ENV=production

# Comando para iniciar o servidor
CMD ["npm", "start"]