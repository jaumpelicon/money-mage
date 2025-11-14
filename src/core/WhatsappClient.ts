import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';
import 'dotenv/config';




export class WhatsappClient {
  private client: Client;

  constructor() {
    // Carregar variáveis de ambiente
    dotenv.config();
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './sessions', // evita problemas de permissão
      }),

      // Chromium do Puppeteer: SEM executablePath → MAIS ESTÁVEL!
      puppeteer: {
        headless: false, // no macOS corporativo é melhor
        dumpio: true, // LOGS AVANÇADOS DO CHROMIUM
        args: [
          '--disable-web-security',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
        ],
        timeout: 120000, // dá tempo do chromium subir
      },

      // SEM webVersion fixa → evita erros de compatibilidade
      webVersionCache: {
        type: 'none',
      },
    });

    this.registerEvents();
  }

  // Eventos com logs avançados
  private registerEvents(): void {
    this.client.on('qr', (qr) => {
      console.log('\n📱 ESCANEIE O QR CODE ABAIXO:\n');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('authenticated', () => {
      console.log('🔐 Autenticado com sucesso!');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
      console.error('💡 Dica: exclua a pasta ./sessions e tente novamente.');
    });

    this.client.on('ready', () => {
      console.log('\n✅ WhatsApp conectado e pronto para uso!');
    });

    this.client.on('disconnected', (reason) => {
      console.error('⚠️ Cliente desconectado:', reason);
      console.log('🔄 Tentando reconectar automaticamente...');
      this.client.initialize();
    });

    this.client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Carregando WhatsApp: ${percent}% - ${message}`);
    });

    // LOG TOTAL DE TODA MENSAGEM DO WHATSAPP (DEBUG PROFUNDO)
    this.client.on('message', (msg) => {
      console.log(`📨 RAW MESSAGE RECEIVED:`, {
        from: msg.from,
        to: msg.to,
        body: msg.body,
        id: msg.id._serialized,
        timestamp: msg.timestamp,
        type: msg.type,
        fromMe: msg.fromMe,
        deviceType: msg.deviceType,
      });
    });
  }

  // Iniciar a conexão
  public initialize(): Promise<void> {
    console.log('\n⏳ Inicializando cliente WhatsApp...\n');
    return this.client.initialize();
  }

  // Expor o cliente para outros arquivos
  public getClient(): Client {
    return this.client;
  }
}
