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
- [x] Traduzir posicoes dos jogadores do ingles para portugues brasileiro
- [x] Reverter posicoes para abreviacoes (ATA, ME, MEI) em vez de traducao completa
- [x] Traduzir posicoes para portugues abreviado (MVC, VOL, MEI, etc)
- [x] Atualizar mapeamento de posicoes com as posicoes exatas do site (GOL, ZAG, LD, LE, ADD, ADE, VOL, MC, MEI, MD, ME, PD, PE, ATA, SA)
- [x] Adicionar extracao de URL da imagem do jogador ao JSON
- [x] Adicionar extracao do valor de mercado dos jogadores ao JSON
- [x] Adicionar visualizacao do valor de mercado na tabela de resultados
- [x] Adicionar instalacao automatica do Chrome como padrao no projeto
- [x] Corrigir erro de dependencias de sistema do Chrome (libglib-2.0)
- [x] Refatorar scraper para nao depender de Puppeteer/navegador headless
- [x] Otimizar axios com headers realistas e retry logic para performance
- [x] Integrar ScraperAPI para contornar bloqueios automaticamente
- [x] Corrigir extracao de posicoes - seletores CSS incorretos
- [x] Corrigir extracao de valores de mercado - seletores CSS incorretos


## Novos Recursos - Extração de Detalhes de Clubes (Sprint 2)

### Backend
- [x] Criar tipos TypeScript para TeamDetails e TeamDetailsResult
- [x] Implementar função extractTeamDetailsFromPage para extrair detalhes de uma página individual de time
- [x] Implementar função scrapeSofifaTeamDetails para extrair detalhes de múltiplos times
- [x] Adicionar endpoint tRPC extractTeamDetails
- [x] Adicionar import da função no routers.ts

### Frontend
- [x] Adicionar novo modo 'details' ao Home.tsx
- [x] Adicionar tipos TeamDetails e TeamDetailsResult
- [x] Implementar handler handleExtractTeamDetails
- [x] Implementar handler handleDownloadTeamDetailsJSON
- [x] Adicionar botão "Detalhes de Clubes" no seletor de modo
- [x] Adicionar tabela de resultados para detalhes de clubes
- [x] Adicionar suporte a download de JSON com detalhes

### Testes
- [x] Adicionar testes de validação de entrada para scrapeSofifaTeamDetails
- [x] Adicionar testes de estrutura de dados
- [x] Adicionar testes de tratamento de erros
- [x] Todos os 28 testes passando

### Informações Extraídas por Clube
- [x] Nome do clube
- [x] Liga
- [x] Estádio (Home stadium)
- [x] Time rival (Rival team)
- [x] Prestígio internacional (International prestige)
- [x] Prestígio local (Domestic prestige)


## Sprint 3 - Extração em Lote de Detalhes de Clubes

### Backend
- [x] Criar função scrapeSofifaTeamDetailsBatch para extração em lote
- [x] Adicionar endpoint tRPC extractTeamDetailsBatch

### Frontend
- [x] Adicionar suporte a modo em lote no seletor
- [x] Adicionar campos de offset inicial e final
- [x] Implementar handler handleExtractTeamDetailsBatch
- [x] Atualizar interface para suportar ambos os modos (simples e lote)

### Testes
- [x] Adicionar testes para validação de entrada em lote
- [x] Adicionar testes de intervalo de offsets
