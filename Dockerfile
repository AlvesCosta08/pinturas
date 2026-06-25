# 1. Imagem leve do Nginx
FROM nginx:alpine

# 2. Copia APENAS o conteúdo da pasta 'frontend' para o diretório padrão do Nginx
# (Aqui está o segredo para o futuro: quando for React, o build gerará os arquivos aqui)
COPY ./frontend /usr/share/nginx/html

# 3. Expõe a porta 80
EXPOSE 80

# 4. Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]