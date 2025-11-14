import Anthropic from '@anthropic-ai/sdk';
import { User, Expense } from '../models/User';

class AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeExpense(message: string, user: User): Promise<{
    amount: number | null;
    description: string;
    category: string;
    type: 'fixed' | 'variable';
  }> {
    const prompt = `Você é um assistente financeiro. Analise a seguinte mensagem de gasto e extraia as informações:

Mensagem: "${message}"

Categorias disponíveis: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Outros, Investimento, Emergência

Responda APENAS com um JSON no seguinte formato (sem markdown, sem explicações):
{
  "amount": valor numérico ou null,
  "description": "descrição do gasto",
  "category": "categoria do gasto",
  "type": "fixed ou variable"
}

Regras:
- Se não houver valor numérico claro, retorne amount: null
- Type "fixed" para gastos recorrentes (aluguel, assinaturas, etc)
- Type "variable" para gastos pontuais
- Seja preciso na categorização`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed;
    }

    throw new Error('Não foi possível analisar o gasto');
  }

  async getFinancialAdvice(user: User, expenses: Expense[], totalExpenses: number): Promise<string> {
    const prompt = `Você é um consultor financeiro especializado. Analise a situação financeira:

PERFIL DO USUÁRIO:
- Nome: ${user.name}
- Orçamento mensal: R$ ${user.monthlyBudget.toFixed(2)}
- Total gasto até agora: R$ ${totalExpenses.toFixed(2)}
- Saldo restante: R$ ${(user.monthlyBudget - totalExpenses).toFixed(2)}

GASTOS POR CATEGORIA:
${this.formatExpensesByCategory(expenses)}

PERFIL FINANCEIRO RECOMENDADO:
${user.financialProfile ? `
- Gastos fixos: ${user.financialProfile.fixedExpensesPercentage}%
- Gastos variáveis: ${user.financialProfile.variableExpensesPercentage}%
- Investimentos: ${user.financialProfile.investmentPercentage}%
- Reserva de emergência: ${user.financialProfile.emergencyFundPercentage}%
` : 'Não configurado'}

Forneça uma análise breve (máximo 5 parágrafos) com:
1. Avaliação geral dos gastos
2. Áreas onde pode economizar
3. Sugestões práticas e específicas
4. Dica de investimento consciente (se houver margem)
5. Alerta se estiver gastando demais

Seja empático, prático e motivador. Use linguagem simples e brasileira.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return 'Não foi possível gerar análise financeira.';
  }

  async getOnboardingAdvice(name: string, monthlyBudget: number): Promise<{
    message: string;
    financialProfile: {
      fixedExpensesPercentage: number;
      variableExpensesPercentage: number;
      investmentPercentage: number;
      emergencyFundPercentage: number;
    };
  }> {
    const prompt = `Você é um consultor financeiro. Um novo usuário acabou de se cadastrar:

Nome: ${name}
Orçamento mensal: R$ ${monthlyBudget.toFixed(2)}

Forneça:
1. Uma mensagem de boas-vindas calorosa e motivadora (máximo 3 parágrafos)
2. Orientação sobre como distribuir o orçamento baseado em boas práticas financeiras
3. Dicas práticas de gestão financeira

Após a mensagem, forneça um JSON com a distribuição recomendada:

Formato da resposta:
---MENSAGEM---
[sua mensagem aqui]
---PERFIL---
{
  "fixedExpensesPercentage": número,
  "variableExpensesPercentage": número,
  "investmentPercentage": número,
  "emergencyFundPercentage": número
}

As porcentagens devem somar 100%. Use a regra 50/30/20 como base, adaptando para incluir emergência.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parts = content.text.split('---PERFIL---');
      const message = parts[0].replace('---MENSAGEM---', '').trim();
      const profileJson = parts[1].trim();
      const financialProfile = JSON.parse(profileJson);

      return { message, financialProfile };
    }

    // Fallback padrão
    return {
      message: `Olá, ${name}! Bem-vindo ao seu assistente financeiro pessoal! 🎉\n\nVou te ajudar a gerenciar seus R$ ${monthlyBudget.toFixed(2)} mensais de forma inteligente.\n\nVamos começar essa jornada juntos!`,
      financialProfile: {
        fixedExpensesPercentage: 50,
        variableExpensesPercentage: 30,
        investmentPercentage: 15,
        emergencyFundPercentage: 5,
      },
    };
  }

  private formatExpensesByCategory(expenses: Expense[]): string {
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    return Object.entries(byCategory)
      .map(([cat, amount]) => `- ${cat}: R$ ${amount.toFixed(2)}`)
      .join('\n');
  }
}

export default new AIService();