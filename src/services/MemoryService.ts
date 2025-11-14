import { User, Expense, MonthlyReport } from '../models/User';

class MemoryService {
  private users: Map<string, User> = new Map();
  private expenses: Map<string, Expense[]> = new Map();
  private reports: Map<string, MonthlyReport[]> = new Map();

  // User operations
  createUser(phoneNumber: string, name: string, monthlyBudget: number): User {
    const user: User = {
      phoneNumber,
      name,
      monthlyBudget,
      onboardingComplete: false,
      createdAt: new Date(),
    };
    this.users.set(phoneNumber, user);
    return user;
  }

  getUser(phoneNumber: string): User | undefined {
    return this.users.get(phoneNumber);
  }

  updateUser(phoneNumber: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(phoneNumber);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(phoneNumber, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  // Expense operations
  addExpense(expense: Expense): void {
    const userExpenses = this.expenses.get(expense.userId) || [];
    userExpenses.push(expense);
    this.expenses.set(expense.userId, userExpenses);
  }

  getExpenses(userId: string, month?: string): Expense[] {
    const allExpenses = this.expenses.get(userId) || [];
    if (month) {
      return allExpenses.filter(e => e.month === month);
    }
    return allExpenses;
  }

  getCurrentMonthExpenses(userId: string): Expense[] {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.getExpenses(userId, currentMonth);
  }

  getTotalExpensesCurrentMonth(userId: string): number {
    const expenses = this.getCurrentMonthExpenses(userId);
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  getExpensesByCategory(userId: string, month: string): Record<string, number> {
    const expenses = this.getExpenses(userId, month);
    const byCategory: Record<string, number> = {};

    expenses.forEach(expense => {
      const category = expense.category;
      byCategory[category] = (byCategory[category] || 0) + expense.amount;
    });

    return byCategory;
  }

  // Report operations
  generateMonthlyReport(userId: string, month: string): MonthlyReport {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const expenses = this.getExpenses(userId, month);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expensesByCategory = this.getExpensesByCategory(userId, month);
    const balance = user.monthlyBudget - totalExpenses;
    const savingsRate = ((balance / user.monthlyBudget) * 100);

    const alerts: string[] = [];

    // Alertas de gastos excessivos
    if (totalExpenses > user.monthlyBudget) {
      alerts.push(`⚠️ Você ultrapassou seu orçamento em R$ ${(totalExpenses - user.monthlyBudget).toFixed(2)}`);
    } else if (totalExpenses > user.monthlyBudget * 0.9) {
      alerts.push('⚠️ Você já gastou mais de 90% do seu orçamento mensal!');
    } else if (totalExpenses > user.monthlyBudget * 0.75) {
      alerts.push('⚠️ Atenção: Você já gastou 75% do seu orçamento mensal.');
    }

    // Alerta de taxa de poupança baixa
    if (savingsRate < 10) {
      alerts.push('💡 Sua taxa de economia está baixa. Tente poupar pelo menos 10% da sua renda.');
    }

    const report: MonthlyReport = {
      userId,
      month,
      totalExpenses,
      totalIncome: user.monthlyBudget,
      balance,
      expensesByCategory,
      savingsRate,
      alerts
    };

    // Salvar relatório
    const userReports = this.reports.get(userId) || [];
    userReports.push(report);
    this.reports.set(userId, userReports);

    return report;
  }

  getReport(userId: string, month: string): MonthlyReport | undefined {
    const reports = this.reports.get(userId) || [];
    return reports.find(r => r.month === month);
  }
}

export default new MemoryService();