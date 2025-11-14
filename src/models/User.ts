export interface User {
  phoneNumber: string;
  name: string;
  monthlyBudget: number;
  onboardingComplete: boolean;
  createdAt: Date;
  financialProfile?: {
    fixedExpensesPercentage: number; // % recomendado para gastos fixos
    variableExpensesPercentage: number; // % para gastos variáveis
    investmentPercentage: number; // % para investimentos
    emergencyFundPercentage: number; // % para reserva de emergência
  };
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  type: 'fixed' | 'variable';
  date: Date;
  month: string; // formato: YYYY-MM
}

export enum ExpenseCategory {
  ALIMENTACAO = 'Alimentação',
  TRANSPORTE = 'Transporte',
  MORADIA = 'Moradia',
  SAUDE = 'Saúde',
  EDUCACAO = 'Educação',
  LAZER = 'Lazer',
  VESTUARIO = 'Vestuário',
  OUTROS = 'Outros',
  INVESTIMENTO = 'Investimento',
  EMERGENCIA = 'Emergência'
}

export interface MonthlyReport {
  userId: string;
  month: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  expensesByCategory: Record<string, number>;
  savingsRate: number;
  alerts: string[];
}