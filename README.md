# 🤖 Bot WhatsApp - Gestão Financeira com IA

Bot inteligente para WhatsApp que ajuda você a gerenciar suas finanças pessoais usando Inteligência Artificial (Claude da Anthropic).

## 🎯 Funcionalidades

### 📝 Registro de Gastos
- Envie mensagens naturais sobre seus gastos
- IA categoriza automaticamente (alimentação, transporte, moradia, etc.)
- Identifica se é gasto fixo ou variável
- Alertas em tempo real sobre seu orçamento

### 📊 Análise Financeira
- Relatórios mensais detalhados
- Análise inteligente com recomendações personalizadas
- Distribuição de gastos por categoria
- Gráficos de progresso do orçamento

### 💡 Consultoria Financeira
- Orientações sobre como distribuir seu orçamento
- Dicas de economia e investimento
- Alertas quando você está gastando demais
- Recomendações baseadas no método 50/30/20

## 🚀 Como Usar

### Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **Conta na Anthropic** para obter API Key do Claude
3. **WhatsApp** instalado no celular

### Instalação

```bash
# 1. Clone ou crie o projeto
mkdir whatsapp-finance-bot
cd whatsapp-finance-bot

# 2. Instale as dependências
npm install

# 3. Configure o arquivo .env
cp .env.example .env
# Edite o .env e adicione sua ANTHROPIC_API_KEY

# 4. Compile o TypeScript
npm run build

# 5. Execute o bot
npm run dev
```

### Primeira Execução

1. Execute `npm run dev`
2. Um **QR Code** aparecerá no terminal
3. Abra o WhatsApp no celular
4. Vá em **Configurações > Aparelhos conectados > Conectar aparelho**
5. Escaneie o QR Code
6. Aguarde a mensagem "✅ Bot conectado e pronto!"

### Configuração da API Key

1. Acesse: https://console.anthropic.com/
2. Crie uma conta (se não tiver)
3. Gere uma API Key
4. Cole a chave no arquivo `.env`:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxx
```

## 📱 Como Usar o Bot

### Primeiro Acesso

1. Envie qualquer mensagem para o bot
2. O bot perguntará seu **nome**
3. Depois perguntará seu **orçamento mensal**
4. Você receberá orientações personalizadas sobre gestão financeira

### Registrar Gastos

Basta enviar mensagens naturais:

```
Gastei 50 reais no mercado
Paguei 200 na conta de luz
Comprei um livro por 35
```

O bot automaticamente:
- Identifica o valor
- Categoriza o gasto
- Atualiza seu saldo
- Te alerta se necessário

### Comandos Disponíveis

```
/ajuda          - Lista todos os comandos
/saldo          - Ver saldo atual e total gasto
/relatorio      - Relatório completo do mês
/analise        - Análise financeira com IA
/categorias     - Gastos por categoria
/orcamento 3500 - Alterar orçamento mensal
/perfil         - Ver seu perfil financeiro
```

## 🏗️ Estrutura do Projeto

```
whatsapp-finance-bot/
├── src/
│   ├── index.ts                    # Arquivo principal
│   ├── controllers/
│   │   └── WhatsAppController.ts   # Lógica do bot
│   ├── services/
│   │   ├── MemoryService.ts        # Armazenamento em memória
│   │   └── AIService.ts            # Integração com Claude
│   ├── models/
│   │   └── User.ts                 # Modelos de dados
│   └── config/
├── .env                            # Variáveis de ambiente
├── tsconfig.json                   # Configuração TypeScript
├── package.json                    # Dependências
└── README.md                       # Este arquivo
```

## 🧠 Como Funciona a IA

O bot usa o **Claude Sonnet 4** da Anthropic para:

1. **Análise de Gastos**: Identifica valores, categorias e tipos de gasto
2. **Consultoria Financeira**: Gera análises personalizadas baseadas no seu perfil
3. **Onboarding Inteligente**: Cria um perfil financeiro sob medida para você

## 💾 Armazenamento

Atualmente, o bot usa **memória RAM** para armazenar dados. Isso significa que:
- ✅ É rápido e simples
- ⚠️ Os dados são perdidos quando o bot é reiniciado

### Para produção, considere adicionar:
- MongoDB (dados persistentes)
- PostgreSQL (relacional)
- Redis (cache)

## 📊 Categorias de Gastos

- 🍔 Alimentação
- 🚗 Transporte
- 🏠 Moradia
- ⚕️ Saúde
- 📚 Educação
- 🎮 Lazer
- 👕 Vestuário
- 📈 Investimento
- 🆘 Emergência
- 📦 Outros

## 🔒 Segurança

- Dados armazenados localmente
- Sem compartilhamento de informações
- API Key deve ser mantida em segredo
- Não commite o arquivo `.env` no Git

## 🛠️ Desenvolvimento

```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Executar versão compilada
npm start

# Limpar build
npm run clean
```

## 🐛 Troubleshooting

### Bot não conecta
- Verifique se o WhatsApp está ativo no celular
- Limpe os dados: remova a pasta `.wwebjs_auth`
- Tente escanear o QR Code novamente

### Erro de API Key
- Verifique se a chave está correta no `.env`
- Confirme que a chave está ativa no console da Anthropic
- Verifique se há créditos na sua conta

### Bot não responde
- Veja os logs no terminal
- Verifique a conexão com internet
- Reinicie o bot

## 📈 Próximos Passos

### Melhorias Sugeridas:
1. **Persistência de dados** (MongoDB/PostgreSQL)
2. **Gráficos visuais** (enviar imagens com charts)
3. **Exportar relatórios** (PDF, Excel)
4. **Metas financeiras** (definir e acompanhar objetivos)
5. **Alertas proativos** (notificações automáticas)
6. **Multi-usuário** (suporte a família/grupos)
7. **Integração bancária** (Open Banking)
8. **Machine Learning** (previsão de gastos)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir funcionalidades
- Enviar pull requests

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

## 👨‍💻 Autor

Criado com ❤️ para ajudar pessoas a terem mais controle sobre suas finanças.

---

**Dúvidas?** Abra uma issue ou entre em contato!

**Importante:** Este é um projeto educacional. Para uso em produção, considere adicionar testes, monitoramento e segurança adicional.