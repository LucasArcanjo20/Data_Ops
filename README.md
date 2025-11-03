Data_Ops

MVP desenvolvido em **Node.js** para validar telefones, coletar perfis públicos do **LinkedIn** e enviar mensagens via **WhatsApp** de forma segura e em conformidade com a **LGPD**.

---

## Visão Geral

Este MVP foi desenvolvido como resposta ao desafio técnico da Speedio, com foco em **validação de contatos**, **coleta de dados profissionais** e **prospecção automatizada via WhatsApp**.  
O sistema prioriza segurança, conformidade legal e mitigação de riscos de bloqueio.

**Objetivo Geral:**  
Construir um MVP em 4 semanas capaz de:
- Validar números telefônicos.
- Coletar dados públicos de profissionais no LinkedIn.
- Enviar mensagens comerciais via WhatsApp com opt-out e logs auditáveis.

**Escopo do MVP:**
| Processo | Meta Diária |
|-----------|--------------|
| Validação de Telefones | 100–500 números |
| Envio de Mensagens | 50–100 mensagens |
| Coleta de Perfis (LinkedIn) | ~20 perfis |

---

## Arquitetura do Sistema

A arquitetura foi projetada para ser modular e evolutiva, separando os componentes em processos independentes.

### Fluxo Geral
```
Input (CSV/JSON)
   ↓
Cleaner → Queue (BullMQ/Redis, opcional)
   ↓
ValidadorTelefones
   ↓
Storage (JSON/CSV)
   ↓
EnviadorWhatsApp
   ↓
Logs & Monitoramento
```
Em paralelo:  
`ColetorLinkedIn` → coleta dados públicos com Puppeteer Stealth.

---

### Componentes Principais

| Módulo | Função | Tecnologias |
|--------|--------|-------------|
| **Input** | Arquivos CSV/JSON com telefones e metadados. | — |
| **Cleaner** | Normaliza e valida formatos telefônicos. | `google-libphonenumber` |
| **Queue (opcional)** | Gerencia tarefas em fila. | `BullMQ + Redis` |
| **ValidadorTelefones** | Classifica status (`invalid`, `valid`, `active/whatsapp`). | `Twilio Lookup / WhatsApp API` |
| **ColetorLinkedIn** | Extrai dados públicos de perfis profissionais. | `Puppeteer + Stealth Plugin` |
| **EnviadorWhatsApp** | Envia mensagens seguras com opt-out. | `WhatsApp Business API`, `Twilio`, `MessageBird` |
| **Storage** | Armazena resultados e logs. | JSON/CSV → futuro: PostgreSQL/MongoDB |
| **Logs & Monitoramento** | Registra eventos, erros e métricas. | Arquivos locais / Telegram / Email |

---

## Tecnologias Utilizadas

- **Node.js ≥ 16** — runtime principal.
- **google-libphonenumber** — normalização de números.
- **Puppeteer + Stealth Plugin** — scraping controlado do LinkedIn.
- **WhatsApp Business API / Twilio / MessageBird** — envio seguro de mensagens.
- **BullMQ + Redis (opcional)** — controle de filas e escalabilidade.
- **JSON / CSV** — armazenamento inicial.
- **Docker (planejado)** — containerização dos módulos.

---

## Estrutura do Repositório

```
SPEED IO
DataOps
├── desafio-speedio
│   ├── data
│   │   ├── input
│   │   │   └── telefones.csv
│   │   └── logs
│   │       └── telefones.log
│   └── output
│       ├── resultados_telefones.json
│       ├── resultados_twilio.json
│       ├── logs.json
│       ├── resultados_twilio.json
│       └── resultados_whatsapp.json
│   
├── logs.json
├── resultados_twilio.json
├── resultados_whatsapp.json
├── resultados.json
├── telefones.csv
├── linkedin-scraper
├── JS index.js
├── output.csv
├── package-lock.json
├── package.json
├── profiles.csv
├── node_modules
├── src
│   ├── batchValidatePhones.js
│   ├── logger.js
│   ├── pipeline.js
│   ├── sendWhatsAppMessages.js
│   ├── validatePhones.js
│   └── validatePhonesTwilio.js
├── .gitignore
├── ecretsfl
├── et --soft HEAD--1
├── u origin main
├── .env
├── README.md
└── relatorio_final.js
```

---

## Processos Detalhados

### 1️⃣ Validação de Telefones
- **Entrada:** CSV/JSON de números.  
- **Normalização:** `google-libphonenumber`.  
- **Validação:** Twilio / WhatsApp API → status (`active`, `invalid`, `not_on_whatsapp`).  
- **Controle:** 2–3s entre requisições para evitar bloqueios.  
- **Saída:** `resultados_telefones.json` com logs e timestamps.

**Proteções:**
- Volume limitado a 500 números/dia.
- Uso de API oficial.
- Monitoramento de erros e bloqueios.

---


## 2️⃣ Coleta de Dados (LinkedIn)

O módulo de coleta de dados foi criado para capturar informações públicas de profissionais no LinkedIn de forma controlada, sem violar os termos da plataforma nem comprometer a reputação do sistema.

**Ferramenta utilizada:**  
A coleta é feita com o **Puppeteer**, uma biblioteca Node.js que simula a navegação de um usuário real em um navegador automatizado.  
Para evitar detecção, é usado o **plugin Stealth**, que mascara a automação e imita o comportamento humano, reduzindo o risco de bloqueio.

**Funcionamento geral:**  
O sistema realiza buscas por palavras-chave ou profissões definidas (como “engenheiro de dados” ou “analista de marketing”), acessa os primeiros resultados e coleta apenas informações **públicas**, como:
- Nome completo
- Cargo atual
- Empresa
- Localização

Esses dados são salvos em formato **CSV** ou **JSON**, permitindo integração simples com outras partes do MVP.

**Metas e limites de operação:**  
Durante o MVP, o foco é manter o volume baixo para garantir estabilidade:
- Coleta de aproximadamente **20 a 30 perfis por dia** por instância.  
- Pausas de **2 a 3 minutos entre buscas** e **2 a 10 segundos entre perfis**.  
Esses intervalos imitam o comportamento humano e reduzem o risco de detecção pelo LinkedIn.

**Mitigações contra bloqueio:**
- Rotação de **user-agents** (identidades virtuais do navegador) para parecer que os acessos vêm de usuários diferentes.  
- Pausa automática em caso de **captcha**.  
- Uso de **proxies** (endereços IP alternativos) sob demanda, caso o sistema detecte bloqueios.

**Métricas acompanhadas:**
- Taxa de bloqueio (quantos acessos são negados pela plataforma).  
- Custo por perfil coletado (tempo e recursos).  
- Tempo médio de coleta por perfil.  
Essas métricas ajudam a dimensionar o custo e a viabilidade da automação em escala.

---

## 3️⃣ Envio de Mensagens WhatsApp

O módulo de envio automatizado de mensagens é responsável por realizar a prospecção comercial via **WhatsApp**, respeitando as regras de uso da plataforma e as exigências da **LGPD**.

**API e provedores:**  
A integração é feita com a **WhatsApp Business API**, ou, alternativamente, com provedores confiáveis como **Twilio** ou **MessageBird**, que oferecem rotas oficiais de envio e monitoramento de mensagens.

**Regras de operação:**
1. **Verificação de opt-out:** Antes de enviar qualquer mensagem, o sistema confirma se o contato não solicitou o descadastro.  
2. **Controle de ritmo (pacing):** Há um intervalo de **2 a 3 segundos entre cada envio** para imitar o comportamento humano e reduzir o risco de bloqueio.  
3. **Registro completo:** Cada envio e resposta é registrado em log, com horário, status e identificador do destinatário.  

**Modelo de mensagem utilizado:**
```
Olá [Nome], tudo bem? Me chamo [Seu Nome] da Speedio.
Vi que você trabalha com [Área] e achei que nosso serviço de dados poderia te ajudar.
Se não quiser receber mais mensagens, responda SAIR.
```
Esse modelo foi pensado para ser respeitoso, direto e transparente.  
A frase “Responda SAIR” garante o direito de recusa, atendendo às exigências da LGPD.

**Controle de reputação:**
- Utilização de **número reserva** caso o principal seja bloqueado.  
- Escalonamento gradual do volume de envios.  
- Monitoramento contínuo de entregas e respostas, criando métricas de engajamento.

---

## Riscos, Gargalos e Contramedidas

Abaixo estão os principais riscos técnicos e operacionais identificados, com suas respectivas estratégias de mitigação:

| Risco | Descrição | Mitigação |
|-------|------------|-----------|
| **Bloqueio do WhatsApp** | O envio em grande volume pode gerar bloqueio de número ou conta. | Uso da API oficial, limites diários de envio e monitoramento de reputação. |
| **Bloqueio do LinkedIn** | A automação pode ser detectada como comportamento suspeito. | Uso do modo stealth, delays longos, proxies e comportamento humano simulado. |
| **Questões de LGPD / Privacidade** | Coleta ou contato sem consentimento explícito. | Implementar opt-out em todas as mensagens e manter logs auditáveis de consentimento. |
| **Gargalo de performance** | O volume de dados pode crescer rapidamente. | Utilizar filas (BullMQ), modularização e migração para banco de dados real. |
| **Dependência de terceiros** | APIs externas podem falhar ou mudar regras. | Ter provedores alternativos e criar mocks locais para testes. |

Cada uma dessas medidas foi pensada para garantir que o MVP seja funcional, seguro e sustentável ao longo do tempo.

---

## Privacidade e Conformidade (LGPD)

O projeto segue princípios de **transparência, necessidade e segurança**, conforme exigido pela **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**.

- **Opt-out obrigatório:** Todas as mensagens incluem a opção de descadastro (“Responda SAIR”).  
- **Retenção de logs:** As informações de envio e coleta são armazenadas por até **30 dias** apenas para auditoria.  
- **Minimização de dados:** São coletados apenas dados públicos e estritamente necessários.  
- **Registro de consentimento:** Todas as ações são registradas com data, hora e finalidade do tratamento.  
- **Segurança e acesso:** Quando houver migração para banco de dados, será implementada criptografia em repouso e controle de acesso restrito.

Essas práticas garantem conformidade com a LGPD e reduzem o risco de uso indevido das informações.

---

## Monitoramento e Logs

O sistema inclui mecanismos de observabilidade desde o MVP para garantir rastreabilidade e resposta rápida a erros.

- **Logs locais:** Gerados nos arquivos `logs/validations.log` e `logs/sent.log`, em formato JSONL, contendo data, ação e resultado.  
- **Métricas iniciais:** Podem ser exportadas para uma planilha (Google Sheets) para acompanhamento manual dos volumes de envio, taxas de erro e bloqueios.  
- **Dashboard (futuro):** Quando houver banco de dados real, será implementado o uso de ferramentas como **Metabase** ou **Grafana** para visualização das métricas.  
- **Alertas automáticos:** O sistema poderá enviar notificações por **Telegram** ou **e-mail** caso o índice de erro ultrapasse determinado limite.  
- **Retenção:** Todos os logs são mantidos por 30 dias, respeitando o princípio de minimização.

Esse modelo de monitoramento garante controle operacional e transparência sobre todas as atividades do sistema.

---

## Escalabilidade — Próximos Passos

Embora o MVP utilize uma estrutura simples (arquivos locais e execução sequencial), a arquitetura foi planejada para crescer sem reescrever o sistema do zero.

1. **Migração de armazenamento:** Substituir JSON/CSV por banco de dados PostgreSQL ou MongoDB, permitindo consultas e integrações mais robustas.  
2. **Implementação de filas:** Adotar BullMQ e Redis para orquestrar tarefas em paralelo e distribuir a carga.  
3. **Containerização:** Separar cada módulo (validador, coletor e enviador) em containers independentes usando Docker.  
4. **Orquestração automática:** Utilizar Kubernetes para escalar dinamicamente conforme a demanda.  
5. **Observabilidade completa:** Integrar Prometheus e Grafana para métricas, logs e alertas centralizados.

Essas etapas preparam o sistema para lidar com grandes volumes e manter alta disponibilidade em ambientes corporativos.

---

## Plano Detalhado — 4 Semanas

| Semana | Entregas | Objetivo |
|--------|-----------|----------|
| **1** | Configuração do ambiente e desenvolvimento do validador de telefones. | Reduzir o risco técnico inicial e validar o fluxo básico de dados. |
| **2** | Integração com WhatsApp e implementação do coletor básico de LinkedIn. | Testar o envio de mensagens e a coleta inicial em ambiente controlado. |
| **3** | Escala controlada e inclusão de monitoramento. | Aumentar o volume gradualmente e garantir estabilidade do sistema. |
| **4** | Testes finais, consolidação de métricas e documentação completa. | Garantir a entrega final e preparar o MVP para avaliação. |

**Justificativa da ordem:**  
A sequência prioriza primeiro os riscos técnicos e legais (validação e opt-out), depois o teste de integração entre os módulos, e por fim a escalabilidade e a documentação.  
Esse formato de entrega incremental permite aprendizado contínuo e ajustes rápidos a cada etapa.

---

## Resultados Esperados (MVP)

Ao final das quatro semanas, o MVP deverá demonstrar:

- Um processo de **validação de telefones funcional e auditável**, com registros de cada tentativa.  
- Um **envio de mensagens controlado**, com rastreamento e opt-out ativo.  
- Uma **coleta básica de dados públicos** de forma segura e sem bloqueios.  
- Uma arquitetura pronta para **migração gradual** para soluções escaláveis e integradas.

Esses resultados comprovam a viabilidade técnica e operacional da proposta, equilibrando eficiência, segurança e conformidade legal.

---

## Observação

├── ecretsfl
├── et --soft HEAD--1
├── u origin main

Arquivos empacotados: por que não foi possível ler as variáveis do arquivo .env? Esses arquivos contêm dados sensíveis (credenciais e códigos sigilosos) que permitem acessar informações protegidas.
Para executar a aplicação, é necessário fornecer: chaves de API, senhas e tokens pessoais

## Referências

- [Node.js Documentation](https://nodejs.org/)
- [Twilio Developer Docs](https://www.twilio.com/docs)
- [WhatsApp Business API (Meta)](https://developers.facebook.com/docs/whatsapp/)
- [Lei Geral de Proteção de Dados (LGPD)](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Puppeteer Documentation](https://pptr.dev)

---


