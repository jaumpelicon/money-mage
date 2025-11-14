import { Message } from 'whatsapp-web.js';
import memoryService from '../services/MemoryService';
import aiService from '../services/AIService';
import { Expense, ExpenseCategory } from '../models/User';


class WhatsAppController {
  private onboardingState: Map<string, 'awaiting_name' | 'awaiting_budget'> = new Map();
  private getRealUserNumber(message: Message): string {
    // Quando você envia mensagem, use o "to"
    if (message.fromMe) return message.to;

    // Quando outra pessoa envia, use o "from"
    return message.from;
  }
  async handleMessage(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const text = message.body.trim();

    // Verificar se usuário existe
    let user = memoryService.getUser(phoneNumber);

    // Processo de onboarding
    if (!user) {
      // Se o usuário não existe, iniciamos o onboarding
      await this.startOnboarding(message);

      // Criamos um usuário temporário para evitar o loop
      memoryService.createUser(phoneNumber, '', 0);
      return;
    }

    if (!user.onboardingComplete) {
      await this.continueOnboarding(message);
      return;
    }

    // Comandos principais
    if (text.toLowerCase().startsWith('/')) {
      await this.handleCommand(message);
      return;
    }

    // Processar como gasto
    await this.processExpense(message);
  }

  private async startOnboarding(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    this.onboardingState.set(phoneNumber, 'awaiting_name');
    await message.reply(
      '👋 *Olá! Bem-vindo ao seu Assistente Financeiro Pessoal!\n\n' +
      'Vou te ajudar a gerenciar seus gastos e tomar decisões financeiras mais inteligentes.\n\n' +
      '📝 Para começar, qual é o seu nome?'
    );
  }

  private async continueOnboarding(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const state = this.onboardingState.get(phoneNumber);
    const text = message.body.trim();

    if (state === 'awaiting_name') {
      // Atualizar usuário com nome
      memoryService.updateUser(phoneNumber, { name: text });
      this.onboardingState.set(phoneNumber, 'awaiting_budget');

      await message.reply(
        `Prazer em te conhecer, *${text}*! 😊\n\n` +
        '💰 Agora me diga: qual é o seu orçamento mensal?\n' +
        '(Exemplo: 3000 ou 3000.50)'
      );
    }
    else if (state === 'awaiting_budget') {
      const budget = parseFloat(text.replace(',', '.'));

      if (isNaN(budget) || budget <= 0) {
        await message.reply(
          '⚠️ Por favor, informe um valor válido.\n' +
          'Exemplo: 3000 ou 3000.50'
        );
        return;
      }

      // Atualizar orçamento
      const user = memoryService.getUser(phoneNumber)!;

      // Obter orientação da IA
      const onboarding = await aiService.getOnboardingAdvice(user.name, budget);

      // Atualizar usuário com perfil financeiro
      memoryService.updateUser(phoneNumber, {
        monthlyBudget: budget,
        onboardingComplete: true,
        financialProfile: onboarding.financialProfile
      });

      const profile = onboarding.financialProfile;
      await message.reply(
        `${onboarding.message}\n\n` +
        '📊 *Distribuição Recomendada do Orçamento:*\n\n' +
        `💸 Gastos Fixos: ${profile.fixedExpensesPercentage}% (R$ ${(budget * profile.fixedExpensesPercentage / 100).toFixed(2)})\n` +
        `🛒 Gastos Variáveis: ${profile.variableExpensesPercentage}% (R$ ${(budget * profile.variableExpensesPercentage / 100).toFixed(2)})\n` +
        `📈 Investimentos: ${profile.investmentPercentage}% (R$ ${(budget * profile.investmentPercentage / 100).toFixed(2)})\n` +
        `🆘 Reserva Emergência: ${profile.emergencyFundPercentage}% (R$ ${(budget * profile.emergencyFundPercentage / 100).toFixed(2)})\n\n` +
        '✅ *Cadastro completo!*\n\n' +
        '📝 Agora você pode me enviar seus gastos naturalmente!\n' +
        'Exemplo: "Gastei 50 reais no mercado"\n\n' +
        '💡 Comandos disponíveis:\n' +
        '/ajuda - Ver todos os comandos\n' +
        '/saldo - Ver quanto você gastou\n' +
        '/relatorio - Relatório detalhado\n' +
        '/analise - Análise financeira com IA'
      );
    }
  }

  private async handleCommand(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const user = memoryService.getUser(phoneNumber)!;
    const command = message.body.toLowerCase().split(' ')[0];

    switch (command) {
      case '/ajuda':
        await message.reply(
          '🤖 *Comandos Disponíveis:*\n\n' +
          '📊 *Consultas:*\n' +
          '/saldo - Ver saldo atual e total gasto\n' +
          '/relatorio - Relatório completo do mês\n' +
          '/analise - Análise financeira com IA\n' +
          '/categorias - Ver gastos por categoria\n\n' +
          '⚙️ *Configurações:*\n' +
          '/orcamento [valor] - Alterar orçamento mensal\n' +
          '/perfil - Ver seu perfil financeiro\n\n' +
          '📝 *Registrar gastos:*\n' +
          'Basta enviar uma mensagem natural!\n' +
          'Ex: "Gastei 50 no uber" ou "Paguei 200 na conta de luz"'
        );
        break;

      case '/saldo':
        await this.showBalance(message);
        break;

      case '/relatorio':
        await this.showReport(message);
        break;

      case '/analise':
        await this.showAIAnalysis(message);
        break;

      case '/categorias':
        await this.showCategorySummary(message);
        break;

      case '/orcamento':
        await this.updateBudget(message);
        break;

      case '/perfil':
        await this.showProfile(message);
        break;

      default:
        await message.reply(
          '❓ Comando não reconhecido.\n' +
          'Digite /ajuda para ver todos os comandos disponíveis.'
        );
    }
  }

  private async processExpense(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const user = memoryService.getUser(phoneNumber)!;

    try {
      await message.reply('🔄 Analisando seu gasto...');

      const analysis = await aiService.analyzeExpense(message.body, user);

      if (analysis.amount === null) {
        await message.reply(
          '🤔 Não consegui identificar o valor do gasto.\n' +
          'Por favor, informe o valor mais claramente.\n' +
          'Exemplo: "Gastei 50 reais no mercado"'
        );
        return;
      }

      const { v4: uuidv4 } = await import('uuid');
      const expense: Expense = {
        id: uuidv4(),
        userId: phoneNumber,
        description: analysis.description,
        amount: analysis.amount,
        category: analysis.category as ExpenseCategory,
        type: analysis.type,
        date: new Date(),
        month: new Date().toISOString().slice(0, 7)
      };

      memoryService.addExpense(expense);

      const totalExpenses = memoryService.getTotalExpensesCurrentMonth(phoneNumber);
      const remaining = user.monthlyBudget - totalExpenses;
      const percentUsed = (totalExpenses / user.monthlyBudget) * 100;

      let alert = '';
      if (remaining < 0) {
        alert = '\n\n⚠️ *ATENÇÃO:* Você ultrapassou seu orçamento!';
      } else if (percentUsed > 90) {
        alert = '\n\n⚠️ Você já gastou mais de 90% do orçamento!';
      } else if (percentUsed > 75) {
        alert = '\n\n⚠️ Atenção: Você já usou 75% do orçamento.';
      }

      await message.reply(
        `✅ *Gasto registrado!*\n\n` +
        `📝 Descrição: ${analysis.description}\n` +
        `💰 Valor: R$ ${analysis.amount.toFixed(2)}\n` +
        `📂 Categoria: ${analysis.category}\n` +
        `🔖 Tipo: ${analysis.type === 'fixed' ? 'Fixo' : 'Variável'}\n\n` +
        `📊 *Resumo do mês:*\n` +
        `Total gasto: R$ ${totalExpenses.toFixed(2)}\n` +
        `Saldo restante: R$ ${remaining.toFixed(2)}\n` +
        `Usado: ${percentUsed.toFixed(1)}%${alert}`
      );
    } catch (error) {
      console.error('Erro ao processar gasto:', error);
      await message.reply(
        '❌ Desculpe, ocorreu um erro ao processar seu gasto.\n' +
        'Por favor, tente novamente.'
      );
    }
  }

  private async showBalance(message: Message): Promise<void> {
    const user = memoryService.getUser(message.from)!;
    const totalExpenses = memoryService.getTotalExpensesCurrentMonth(message.from);
    const remaining = user.monthlyBudget - totalExpenses;
    const percentUsed = (totalExpenses / user.monthlyBudget) * 100;

    const progressBar = this.createProgressBar(percentUsed);

    await message.reply(
      `💰 *Seu Saldo Atual*\n\n` +
      `Orçamento mensal: R$ ${user.monthlyBudget.toFixed(2)}\n` +
      `Total gasto: R$ ${totalExpenses.toFixed(2)}\n` +
      `Saldo restante: R$ ${remaining.toFixed(2)}\n\n` +
      `📊 Uso do orçamento:\n${progressBar} ${percentUsed.toFixed(1)}%`
    );
  }

  private async showReport(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const report = memoryService.generateMonthlyReport(phoneNumber, currentMonth);

    let categoryText = '*Gastos por categoria:*\n';
    for (const [category, amount] of Object.entries(report.expensesByCategory)) {
      categoryText += `• ${category}: R$ ${amount.toFixed(2)}\n`;
    }

    let alertText = '';
    if (report.alerts.length > 0) {
      alertText = '\n\n*Alertas:*\n' + report.alerts.join('\n');
    }

    await message.reply(
      `📋 *Relatório Mensal*\n` +
      `Mês: ${this.formatMonth(currentMonth)}\n\n` +
      `💵 Renda: R$ ${report.totalIncome.toFixed(2)}\n` +
      `💸 Gastos: R$ ${report.totalExpenses.toFixed(2)}\n` +
      `💰 Saldo: R$ ${report.balance.toFixed(2)}\n` +
      `📈 Taxa de poupança: ${report.savingsRate.toFixed(1)}%\n\n` +
      categoryText +
      alertText
    );
  }

  private async showAIAnalysis(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const user = memoryService.getUser(phoneNumber)!;
    const expenses = memoryService.getCurrentMonthExpenses(phoneNumber);
    const totalExpenses = memoryService.getTotalExpensesCurrentMonth(phoneNumber);

    await message.reply('🤖 Gerando análise financeira com IA...');

    try {
      const advice = await aiService.getFinancialAdvice(user, expenses, totalExpenses);
      await message.reply(`🧠 *Análise Financeira IA*\n\n${advice}`);
    } catch (error) {
      console.error('Erro na análise:', error);
      await message.reply('❌ Erro ao gerar análise. Tente novamente mais tarde.');
    }
  }

  private async showCategorySummary(message: Message): Promise<void> {
    const phoneNumber = this.getRealUserNumber(message);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const byCategory = memoryService.getExpensesByCategory(phoneNumber, currentMonth);

    if (Object.keys(byCategory).length === 0) {
      await message.reply('📊 Você ainda não tem gastos registrados este mês.');
      return;
    }

    let text = '📊 *Gastos por Categoria*\n\n';
    const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

    for (const [category, amount] of sorted) {
      text += `${this.getCategoryEmoji(category)} ${category}: R$ ${amount.toFixed(2)}\n`;
    }

    await message.reply(text);
  }

  private async updateBudget(message: Message): Promise<void> {
    const parts = message.body.split(' ');
    if (parts.length < 2) {
      await message.reply(
        '⚠️ Uso correto: /orcamento [valor]\n' +
        'Exemplo: /orcamento 3500'
      );
      return;
    }

    const newBudget = parseFloat(parts[1].replace(',', '.'));
    if (isNaN(newBudget) || newBudget <= 0) {
      await message.reply('⚠️ Por favor, informe um valor válido.');
      return;
    }

    memoryService.updateUser(message.from, { monthlyBudget: newBudget });
    await message.reply(
      `✅ Orçamento atualizado!\n\n` +
      `Novo orçamento mensal: R$ ${newBudget.toFixed(2)}`
    );
  }

  private async showProfile(message: Message): Promise<void> {
    const user = memoryService.getUser(message.from)!;

    let profileText = '';
    if (user.financialProfile) {
      const p = user.financialProfile;
      profileText =
        `\n\n📊 *Distribuição Recomendada:*\n` +
        `• Gastos Fixos: ${p.fixedExpensesPercentage}%\n` +
        `• Gastos Variáveis: ${p.variableExpensesPercentage}%\n` +
        `• Investimentos: ${p.investmentPercentage}%\n` +
        `• Reserva Emergência: ${p.emergencyFundPercentage}%`;
    }

    await message.reply(
      `👤 *Seu Perfil*\n\n` +
      `Nome: ${user.name}\n` +
      `Orçamento mensal: R$ ${user.monthlyBudget.toFixed(2)}\n` +
      `Cadastrado em: ${user.createdAt.toLocaleDateString('pt-BR')}` +
      profileText
    );
  }

  private createProgressBar(percent: number): string {
    const total = 10;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      'Alimentação': '🍔',
      'Transporte': '🚗',
      'Moradia': '🏠',
      'Saúde': '⚕️',
      'Educação': '📚',
      'Lazer': '🎮',
      'Vestuário': '👕',
      'Investimento': '📈',
      'Emergência': '🆘',
      'Outros': '📦'
    };
    return emojis[category] || '📦';
  }

  private formatMonth(month: string): string {
    const [year, monthNum] = month.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[parseInt(monthNum) - 1]} ${year}`;
  }
}

export default new WhatsAppController();