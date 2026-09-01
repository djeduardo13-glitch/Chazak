# 🌾 Chazak

> **חָזָק** — "Forte e corajoso" *(Josué 1:9)*

Aplicação pessoal PWA para organização do trabalho de cooperador da mocidade CCB.  
Ficheiro único HTML — sem dependências, sem servidor, funciona offline.

---

## Funcionalidades

### 👥 Mocidade
- Lista de jovens com perfis detalhados (categoria, aniversário, contato)
- Tracker de interações — presente, conversa, viagem, outro
- Filtros por categoria e busca por nome
- Indicador de atenção (jovens sem interação recente)

### ✈️ Viagens
- Registo de viagens com organização por carros
- Autocomplete de motoristas e passageiros
- Registo automático no Tracker dos jovens participantes
- Anti-duplicação inteligente

### 📅 Agenda
- Calendário mensal com eventos CCB
- 12 tipos de evento com cores distintas
- Eventos importantes com banner de alerta (⚠️ 7 dias antes)
- Filtros por tipo · Eventos passados automáticamente apagados visualmente

### 🙏 Palavras
- Registo de cultos e serviços
- Organizado por mês (mês atual aberto, passados fechados)
- Filtro por tipo de serviço
- Busca por tipo, data, cidade ou passagem bíblica
- Sincronização automática com eventos da Agenda

### 📖 Bíblia
- **Leitura** — diário de estudo por livro
  - Explicação cap. a cap. com formatação rica
  - Dicionário de termos por livro
  - Versículos bonitos
- **Curiosidades** — notas bíblicas por categoria (Significado, Onde está escrito, Aprofundamento, Biografia, Etimologia...)
- **Favoritos** — versículos favoritos com nota pessoal
- Autocomplete dos 66 livros da Bíblia

### ⚙️ Dados
- Tema claro/escuro
- Exportar/Importar JSON (backup completo)
- Sync via GitHub Gist entre dispositivos

---

## Como usar

1. Faz download de `chazak.html`
2. Abre no browser do Android (Chrome recomendado)
3. Menu → *Adicionar ao ecrã inicial* para instalar como PWA
4. Tudo funciona offline — os dados ficam guardados no dispositivo

---

## Tecnologia

- HTML + CSS + JavaScript vanilla — ficheiro único
- localStorage para persistência
- PWA com ícone 🌾 e suporte a back button Android
- Zero dependências externas (exceto fontes Google)

---

## Versão

**v5.6.0** — Setembro 2026
