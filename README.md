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

### 2️⃣ Coleta de Dados (LinkedIn)
- **Ferramenta:** Puppeteer com plugin Stealth.
- **Meta:** 20–30 perfis/dia/instância.  
- **Campos coletados:** nome, cargo, empresa, localização (dados públicos).  
- **Delays:** 2–3 min entre buscas, 2–10s entre perfis.  
- **Mitigação:** rotação de user-agents, pausa em caso de captcha, proxies sob demanda.  
- **Métricas:** taxa de bloqueio, custo por perfil, tempo médio.

---

### 3️⃣ Envio de Mensagens WhatsApp
- **API:** WhatsApp Business / Twilio / MessageBird.
- **Regras:**
  - Verificar opt-out antes do envio.
  - Pacing de 2–3s entre mensagens.
  - Registrar entregas e respostas.
- **Exemplo de mensagem:**
  ```
  Olá [Nome], tudo bem? Me chamo [Seu Nome] da Speedio.
  Vi que você trabalha com [Área] e achei que nosso serviço de dados poderia te ajudar.
  Se não quiser receber mais mensagens, responda SAIR.
  ```
- **Controle de reputação:** número reserva, volume gradual, logs de entrega.

---

## Riscos, Gargalos e Contramedidas

| Risco | Descrição | Mitigação |
|-------|------------|-----------|
| Bloqueio do WhatsApp | Volume alto ou envios manuais. | API oficial, pacing e monitoramento. |
| Bloqueio do LinkedIn | Detecção de scraping. | Stealth plugin, pausas e proxies. |
| LGPD / Privacidade | Dados pessoais sem consentimento. | Opt-out claro, logs auditáveis, retenção de 30 dias. |
| Performance | Volume crescente. | Filas (BullMQ), microserviços, DB real. |
| Dependência de terceiros | Falhas de API. | Provedores alternativos e mocks locais. |

---

## Privacidade e Conformidade (LGPD)

- Opt-out obrigatório em todas as mensagens.  
- Retenção de logs: 30 dias.  
- Armazenamento mínimo e apenas dados públicos.  
- Registros de consentimento e finalidade do tratamento.  
- Criptografia e controle de acesso (quando migrar para DB real).

---

## Monitoramento e Logs

- **Logs locais:** `logs/validations.log` e `logs/sent.log` (JSONL).  
- **Métricas iniciais:** planilha (Google Sheets) com volume, erros e bloqueios.  
- **Dashboard (futuro):** Metabase / Grafana.  
- **Alertas automáticos:** Telegram / Email quando taxa de erro > X%.  
- **Retenção:** 30 dias.

---

## Escalabilidade — Próximos Passos

1. Migrar armazenamento de JSON → PostgreSQL/MongoDB.  
2. Implementar **BullMQ + Redis** para orquestração.  
3. Rodar cada módulo em container **Docker**.  
4. Orquestrar com **Kubernetes** (autoscaling).  
5. Implementar **Prometheus + Grafana** para observabilidade.

---

## Plano Detalhado — 4 Semanas

| Semana | Entregas | Objetivo |
|--------|-----------|----------|
| **1** | Configuração do ambiente + Validador inicial | Reduzir risco técnico |
| **2** | Integração WhatsApp + Coletor básico | Testar envio e scraping inicial |
| **3** | Escala controlada + Monitoramento | Aumentar volume e estabilidade |
| **4** | Testes finais + Documentação | Consolidar resultados e preparar entrega |

**Justificativa:**  
Começar pequeno reduz riscos de bloqueio e falhas. A evolução por etapas permite validar hipóteses técnicas e legais com segurança.

---

## Resultados Esperados (MVP)

- Prova de conceito funcional com logs e controle de opt-out.  
- Envio de mensagens em ambiente controlado.  
- Coleta básica de perfis sem bloqueios.  
- Base para migração para arquitetura escalável.

---

## Referências

- [Node.js Documentation](https://nodejs.org/)
- [Twilio Developer Docs](https://www.twilio.com/docs)
- [WhatsApp Business API (Meta)](https://developers.facebook.com/docs/whatsapp/)
- [Lei Geral de Proteção de Dados (LGPD)](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [Puppeteer Documentation](https://pptr.dev)

---
