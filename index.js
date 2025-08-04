const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config();

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const pepeTarget = parseFloat(process.env.PEPE_TARGET || "0.0000130");
const flokiTarget = parseFloat(process.env.FLOKI_TARGET || "0.0000150");

async function getPrice(symbol) {
  const resp = await axios.get(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`);
  return parseFloat(resp.data.result.list[0].lastPrice);
}

bot.onText(/\/price(?: (pepe|floki))?/, async (msg, match) => {
  const coin = match[1] ? match[1].toUpperCase() : null;
  if (coin === "PEPE") {
    const price = await getPrice("PEPEUSDT");
    bot.sendMessage(msg.chat.id, `💹 Цена PEPE: $${price}`);
  } else if (coin === "FLOKI") {
    const price = await getPrice("FLOKIUSDT");
    bot.sendMessage(msg.chat.id, `💹 Цена FLOKI: $${price}`);
  } else {
    const p = await getPrice("PEPEUSDT");
    const f = await getPrice("FLOKIUSDT");
    bot.sendMessage(msg.chat.id, `💹 PEPE: $${p}\n💹 FLOKI: $${f}`);
  }
});

bot.onText(/\/forecast/, (msg) => {
  bot.sendMessage(msg.chat.id, "📈 Прогноз:\nPEPE: диапазон $0.0000120–$0.0000135\nFLOKI: возможен рост до $0.00001120 при активности рынка");
});

bot.onText(/\/chart/, (msg) => {
  bot.sendMessage(msg.chat.id, "🖼 Графики за 24 ч:\nPEPE: https://www.tradingview.com/symbols/PEPEUSDT/\nFLOKI: https://www.tradingview.com/symbols/FLOKIUSDT/");
});

bot.onText(/\/menu/, (msg) => {
  bot.sendMessage(msg.chat.id, "🔘 Меню команд:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Цена PEPE", callback_data: "/price pepe" }, { text: "Цена FLOKI", callback_data: "/price floki" }],
        [{ text: "Прогноз", callback_data: "/forecast" }, { text: "График", callback_data: "/chart" }]
      ]
    }
  });
});

async function checkAlerts() {
  const p = await getPrice("PEPEUSDT");
  const f = await getPrice("FLOKIUSDT");
  const tId = parseInt(process.env.CHAT_ID);
  if (p >= pepeTarget) bot.sendMessage(tId, `🚨 PEPE достиг $${p}`);
  if (f >= flokiTarget) bot.sendMessage(tId, `🚨 FLOKI достиг $${f}`);
}

setInterval(checkAlerts, 5 * 60 * 1000);

app.get("/", (req, res) => res.send("Bot is running"));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server started on port", port));
