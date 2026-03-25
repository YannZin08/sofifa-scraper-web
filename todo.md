# SoFIFA Web Scraper - TODO

## Backend
- [x] Instalar dependências (cloudscraper, beautifulsoup4)
- [x] Criar procedure tRPC para scraping de URLs do SoFIFA
- [x] Implementar lógica de extração de dados (nome, idade, overall, potencial, time, posições)
- [x] Adicionar tratamento de erros para URLs inválidas
- [x] Testar extração com URLs de exemplo

## Frontend
- [x] Criar página Home com interface de entrada de URL
- [x] Adicionar campo de input para colar URL do SoFIFA
- [x] Implementar botão de extração
- [x] Adicionar loading state durante processamento
- [x] Implementar exibição de resultados (tabela ou lista de jogadores)
- [x] Adicionar botão de download do JSON
- [x] Implementar tratamento de erros visual
- [x] Adicionar feedback de sucesso após extração

## Testes
- [x] Testar com URLs reais do SoFIFA
- [x] Validar estrutura do JSON gerado
- [x] Testar tratamento de erros
- [x] Testar download do arquivo

## Deploy
- [ ] Criar checkpoint final
- [ ] Entregar aplicação ao usuário


## Bugs Encontrados
- [x] Corrigir erro "Failed to parse URL from /api/scraper/extract" - refatorar tRPC procedure para chamar Python diretamente
- [x] Corrigir erro de mismatch do módulo SRE do Python - usar python3.11 explicitamente
- [x] Corrigir erro persistente de SRE module mismatch - refatorar para usar Node.js puro com axios e cheerio
- [x] Corrigir erro 403 - adicionar suporte a proxy e melhorar headers
- [x] Contornar proteção anti-bot do SoFIFA - implementar Puppeteer com navegador headless
- [x] Instalar Chrome para Puppeteer
