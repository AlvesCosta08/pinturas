# 🎨 Acabamento Premium - Portfólio Profissional

> **Transformamos ambientes com excelência, organização e entrega garantida.**

Landing Page profissional para portfólio de serviços de Pintura, Gesso e Acabamentos de Alto Padrão. Projeto estruturado com arquitetura moderna, pronto para escalar com Vue.js (Frontend) e Node.js (Backend).

---

## 🚀 Tecnologias

### Frontend
- **HTML5** + **Tailwind CSS** (via CDN)
- **JavaScript** puro (menu mobile interativo)
- **Nginx** (servidor web em container Docker)

### Backend (Preparado para expansão)
- **Node.js** + **Express**
- **Docker** para containerização

### Infraestrutura
- **Docker** + **Docker Compose**
- Pronto para deploy em Render, Railway, Fly.io, etc.

---

## 📁 Estrutura do Projeto

```
pinturas/
│
├── docker-compose.yml      # Orquestra Frontend + Backend
├── Dockerfile              # Configuração do Nginx (Frontend)
├── .gitignore              # Ignora arquivos desnecessários
├── README.md               # Este arquivo
│
├── frontend/               # 🎨 Site (HTML/Vue no futuro)
│   ├── index.html          # Landing Page principal
│   └── nginx.conf          # Configuração de rotas do Nginx
│
└── backend/                # ⚙️ API (Node.js)
    ├── Dockerfile          # Configuração do Node
    ├── package.json        # Dependências
    └── server.js           # Servidor Express
```

---

## 🛠️ Como Rodar Localmente

### Pré-requisitos
- [Docker](https://www.docker.com/products/docker-desktop) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

### Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/AlvesCosta08/pinturas.git
cd pinturas
```

2. **Suba os containers:**
```bash
docker-compose up --build
```

3. **Acesse no navegador:**
- **Frontend (Site):** http://localhost
- **Backend (API):** http://localhost:3000/api/health

4. **Para parar os containers:**
```bash
docker-compose down
```

---

## 🌐 Deploy

### Opção 1: Render / Railway / Fly.io
1. Conecte seu repositório do GitHub na plataforma
2. A plataforma detecta automaticamente o `docker-compose.yml`
3. Deploy automático a cada push na branch `main`

### Opção 2: VPS (Hostinger, AWS, DigitalOcean)
```bash
# No servidor
git clone https://github.com/AlvesCosta08/pinturas.git
cd pinturas
docker-compose up -d --build
```

---

## 📱 Contato

- **WhatsApp:** (85) 98621-7161
- **Serviços:** Pintura, Gesso, Drywall e Acabamentos de Alto Padrão
- **Região:** Fortaleza e Região Metropolitana

---

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados © 2024.

---

