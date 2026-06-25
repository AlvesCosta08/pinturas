# 1. Usa a imagem leve do Nginx
FROM nginx:alpine

# 2. Remove os arquivos de teste padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# 3. Copia a configuração customizada do nginx (que está dentro da pasta frontend)
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

# 4. Copia TODO o conteúdo da pasta 'frontend' (incluindo o index.html) para o diretório do Nginx
COPY ./frontend/ /usr/share/nginx/html/

# 5. Expõe a porta 80
EXPOSE 80

# 6. Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]