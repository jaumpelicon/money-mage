import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { User, Expense } from '../models/User';

class AIService {
  private client: GoogleGenerativeAI;
  private generationConfig: GenerationConfig;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    this.generationConfig = {
      temperature: 0.2,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };
  }

  private cleanJsonString(text: string): string {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  }

  async interpretIntent(message: string): Promise<{
    intent: 'add_expense' | 'add_income' | 'get_report' | 'get_balance' | 'get_categorys' | 'get_analysis' | 'unknown';
    amount?: number;
    description?: string;
  }> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Você é um assistente financeiro especializado em interpretar mensagens naturais, informais, com gírias e variações de escrita. Sua tarefa é identificar a intenção do usuário e extrair entidades relevantes.

      Mensagem recebida: "${message}"

      INTENÇÕES PERMITIDAS:
      - add_expense → registrar um gasto
      - add_income → registrar um ganho/recebimento/aumento de orçamento
      - get_report → pedir relatório/resumo geral
      - get_balance → pedir saldo restante/orçamento vs gastos
      - get_categorys → pedir gastos por categoria
      - get_analysis → pedir análise inteligente dos gastos
      - unknown → quando nenhuma intenção acima for clara

      REGRAS:
      1. Interprete sinônimos, variações e frases incompletas.
      2. Se houver um valor em dinheiro, identificar INTENT:
        - Se ligado a gastar, pagar, comprei, perdi → add_expense
        - Se ligado a ganhar, receber, entrou dinheiro, salário → add_income
      3. Se a frase pedir “como estou”, “estou gastando muito?”, “tô indo bem?” → get_analysis
      4. Se pedir resumo geral → get_report
      5. Se pedir saldo ou quanto ainda posso gastar → get_balance
      6. Se pedir “em quê gastei”, “categorias”, “maior gasto”, “onde foi o dinheiro” → get_categorys
      7. Se a mensagem sugerir gasto mas não tiver número → amount = null
      8. A descrição deve ser um resumo curto (ex: “mercado”, “uber”, “salário”, etc.).
      9. Nunca invente valores.
      10. Caso a intenção não esteja clara → intent = "unknown"

      EXEMPLOS DE FRASES QUE DEVEM SER ENTENDIDAS COMO add_expense:
      - "gastei 50 no uber"
      - "paguei 30 de lanche"
      - "comprei algo por 120"
      - "foi 80 reais no mercado"
      - "tive um gasto"
      - "meu dinheiro foi embora hoje"
      - "paguei a fatura"

      EXEMPLOS DE add_income:
      - "ganhei 200"
      - "entrou 150 do pix"
      - "recebi meu salário"
      - "entrou uma grana"

      EXEMPLOS DE get_balance:
      - "quanto tenho?"
      - "meu saldo?"
      - "quanto posso gastar ainda?"
      - "quanto resta?"

      EXEMPLOS DE get_report:
      - "me manda o relatório"
      - "resumo do mês"
      - "como tá meu mês?"

      EXEMPLOS DE get_categorys:
      - "no que gastei?"
      - "gastos por categoria"
      - "maior categoria"

      EXEMPLOS DE get_analysis:
      - "analisa meus gastos"
      - "tô gastando muito?"
      - "como estou financeiramente?"

      RESPOSTA:
      Retorne APENAS o JSON a seguir, sem markdown, sem texto extra:

      {
        "intent": "nome_da_intencao",
        "amount": valor_numerico_ou_null,
        "description": "descricao_do_gasto_ou_ganho"
      }
      `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const cleanedJson = this.cleanJsonString(text);
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (error) {
      console.error('Error interpreting intent with Gemini:', error);
      return { intent: 'unknown' };
    }
  }

  async analyzeExpense(message: string, user: User): Promise<{
    amount: number | null;
    description: string;
    category: string;
    type: 'fixed' | 'variable';
  }> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Você é um assistente financeiro. Analise a seguinte mensagem de gasto e extraia as informações:\n\nMensagem: "${message}"\n\nCategorias disponíveis: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Outros, Investimento, Emergência\n\nResponda APENAS com um JSON no seguinte formato (sem markdown, sem explicações):\n{\n  "amount": valor numérico ou null,\n  "description": "descrição do gasto",\n  "category": "categoria do gasto",\n  "type": "fixed ou variable"\n}\n\nRegras:\n- Se não houver valor numérico claro, retorne amount: null\n- Type "fixed" para gastos recorrentes (aluguel, assinaturas, etc)\n- Type "variable" para gastos pontuais\n- Seja preciso na categorização`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const cleanedJson = this.cleanJsonString(text);
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (error) {
      console.error('Error analyzing expense with Gemini:', error);
      throw new Error('Não foi possível analisar o gasto');
    }
  }

  async analyzeIncome(message: string, user: User): Promise<{
    amount: number | null;
    description: string;
    source: string;
  }> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Você é um assistente financeiro. Analise a seguinte mensagem de ENTRADA de dinheiro e extraia as informações:
    Mensagem: "${message}"

    Categorias de origem: Salário, Freelancer, Venda, Presente, Reembolso, Investimento, Outros

    Responda APENAS com um JSON no seguinte formato (sem markdown, sem explicações):
    {
      "amount": valor numérico ou null,
      "description": "descrição da entrada",
      "source": "origem do dinheiro"
    }

    Regras:
    - Identifique entradas como: "recebi", "caiu dinheiro", "entrou", "me pagaram", "ganhei", "depositaram", etc.
    - Se não houver valor claro, amount = null
    - Seja preciso na origem.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const cleanedJson = this.cleanJsonString(text);
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (error) {
      console.error('Error analyzing income with Gemini:', error);
      throw new Error('Não foi possível analisar a entrada de dinheiro');
    }
  }


  async getFinancialAdvice(user: User, expenses: Expense[], totalExpenses: number): Promise<string> {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Você é um consultor financeiro especializado. Analise a situação financeira:\n\nPERFIL DO USUÁRIO:\n- Nome: ${user.name}\n- Orçamento mensal: R$ ${user.monthlyBudget.toFixed(2)}\n- Total gasto até agora: R$ ${totalExpenses.toFixed(2)}\n- Saldo restante: R$ ${(user.monthlyBudget - totalExpenses).toFixed(2)}\n\nGASTOS POR CATEGORIA:\n${this.formatExpensesByCategory(expenses)}\n\nPERFIL FINANCEIRO RECOMENDADO:\n${user.financialProfile ? `\n- Gastos fixos: ${user.financialProfile.fixedExpensesPercentage}%\n- Gastos variáveis: ${user.financialProfile.variableExpensesPercentage}%\n- Investimentos: ${user.financialProfile.investmentPercentage}%\n- Reserva de emergência: ${user.financialProfile.emergencyFundPercentage}%\n` : 'Não configurado'}\n\nForneça uma análise breve (máximo 5 parágrafos) com:\n1. Avaliação geral dos gastos\n2. Áreas onde pode economizar\n3. Sugestões práticas e específicas\n4. Dica de investimento consciente (se houver margem)\n5. Alerta se estiver gastando demais\n\nSeja empático, prático e motivador. Use linguagem simples e brasileira.`

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error getting financial advice with Gemini:', error);
      return 'Não foi possível gerar análise financeira.';
    }
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
    const model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Você é um consultor financeiro. Um novo usuário acabou de se cadastrar:\n\nNome: ${name}\nOrçamento mensal: R$ ${monthlyBudget.toFixed(2)}\n\nForneça:\n1. Uma mensagem de boas-vindas calorosa e motivadora (máximo 3 parágrafos)\n2. Orientação sobre como distribuir o orçamento baseado em boas práticas financeiras\n3. Dicas práticas de gestão financeira\n\nApós a mensagem, forneça um JSON com a distribuição recomendada:\n\nFormato da resposta:\n---MENSAGEM---\n[sua mensagem aqui]\n---PERFIL---\n{\n  "fixedExpensesPercentage": número,\n  "variableExpensesPercentage": número,\n  "investmentPercentage": número,\n  "emergencyFundPercentage": número\n}\n\nAs porcentagens devem somar 100%. Use a regra 50/30/20 como base, adaptando para incluir emergência.`

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const parts = text.split('---PERFIL---');
      const message = parts[0].replace('---MENSAGEM---', '').trim();
      const profileJson = this.cleanJsonString(parts[1]);
      const financialProfile = JSON.parse(profileJson);

      return { message, financialProfile };
    } catch (error) {
      console.error('Error getting onboarding advice with Gemini:', error);
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
