const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const chatId = process.env.CHAT_ID;
const pepeTarget = parseFloat(process.env.PEPE_TARGET);
const flokiTarget = parseFloat(process.env.FLOKI_TARGET);

async function getPrice(symbol) {
  const resp = await axios.get(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`);
  return parseFloat(resp.data.result.list[0].lastPrice);
}

bot.onText(/\/start|\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, "🔘 Меню:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💹 Цена PEPE", callback_data: "price_pepe" }],
        [{ text: "💹 Цена FLOKI", callback_data: "price_floki" }],
        [{ text: "📈 Прогноз", callback_data: "forecast" }],
        [{ text: "🖼 График", callback_data: "chart" }]
      ]
    }
  });
});

bot.on("callback_query", async (query) => {
  const pepePrice = await getPrice("PEPEUSDT");
  const flokiPrice = await getPrice("FLOKIUSDT");
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

  let message = "";
  switch (query.data) {
    case "price_pepe":
      message = `💹 PEPE: $${pepePrice}`;
      break;
    case "price_floki":
      message = `💹 FLOKI: $${flokiPrice}`;
      break;
    case "forecast":
      message = `📈 Прогноз:\nPEPE: $0.0000120–0.0000135\nFLOKI: рост до $0.0000150 возможен\n🕒 ${now}`;
      break;
    case "chart":
      message = `🖼 Графики за 24ч:\nPEPE: https://www.tradingview.com/symbols/PEPEUSDT/\nFLOKI: https://www.tradingview.com/symbols/FLOKIUSDT/`;
      break;
  }

  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  await bot.answerCallbackQuery(query.id);
});

// Автооповещение при достижении целей
setInterval(async () => {
  const p = await getPrice("PEPEUSDT");
  const f = await getPrice("FLOKIUSDT");
  if (p >= pepeTarget) bot.sendMessage(chatId, `🚨 PEPE достиг $${p}`);
  if (f >= flokiTarget) bot.sendMessage(chatId, `🚨 FLOKI достиг $${f}`);
}, 5 * 60 * 1000);
