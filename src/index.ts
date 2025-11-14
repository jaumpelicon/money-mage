import { WhatsappClient } from './core/WhatsappClient';
import whatsappController from './controllers/WhatsappController';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as dotenv from 'dotenv';
import 'dotenv/config';


// Carregar variáveis de ambiente
dotenv.config();

// Iniciar WhatsApp
const wpp = new WhatsappClient();
const client = wpp.getClient();

wpp.initialize().catch((error) => {
  console.error('❌ Erro ao inicializar WhatsApp:', error);
  process.exit(1);
});

// Processar mensagens no controller
client.on('message', async (message) => {
  try {
    // Ignora grupos e status
    if (message.from.includes('@g.us') || message.from.includes('status')) {
      console.log(`📨 [IGNORADO] Mensagem de grupo/status: ${message.from}`);
      return;
    }

    // NÃO IGNORAR mensagens enviadas para você mesmo (deixa para o controller decidir)
    console.log(`📨 Mensagem recebida de ${message.from}: ${message.body}`);

    await whatsappController.handleMessage(message);

  } catch (err) {
    console.error('❌ Erro ao processar mensagem:', err);
    try {
      await message.reply('⚠️ Ocorreu um erro ao processar sua mensagem. Tente novamente.');
    } catch { }
  }
});

// Erros globais
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Finalização
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando...');
  await client.destroy();
  process.exit(0);
});
