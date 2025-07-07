import { fileURLToPath } from "url";
import { dirname } from "path";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);

const rootDir = dirname(__filename);
console.log(rootDir);

dotenv.config();
const orderState = {};

let bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(ctx => ctx.reply("📚 مرحبا بك في متجر الغزال للكتب، لتسجيل طلب أدخل: \n/talab"));

bot.command("talab", async (ctx) => {
  const userId = ctx.from.id;
  orderState[userId] = {
    step: "awaiting_title",
  };
  ctx.reply("📝 ماهو عنوان الكتاب الذي تريده؟");
});

bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const userInput = ctx.message.text;
  
  const state = orderState[userId];
  if (!state) {
    return ctx.reply("❗أعتذر، لم أتعرف على الأمر المطلوب، إليك قائمة الأوامر المُتاحة:\n/talab\n/bahth\n/info");
  }
  
  switch(state.step) {
    case "awaiting_title": {
      state.bookTitle = userInput;
      state.step = "awaiting_quantity";
      ctx.reply("📦 كم من نسخة؟");
      break;
    }
    case "awaiting_quantity": {
      if (!/^\d+$/.test(userInput)) {
        return ctx.reply("❌ من فضلك أدخِل رقما صحيحا.");
      } else {
        state.quantity = parseInt(userInput);
        state.step = "awaiting_name";
        ctx.reply("👤 ما إسمك الكامل؟ ");
        break;
      }
    } 
    case "awaiting_name": {
      state.name = userInput;
      state.step = "awaiting_phone";
      ctx.reply("📱ما رقم هاتفك؟");
      break;
    }
    case "awaiting_phone": {
      state.phone = userInput;
      state.step = "awaiting_address";
      ctx.reply("🚚 ما عنوان التسليم الخاص بك؟");
      break;
    }
    case "awaiting_address": {
      state.address = userInput;
      state.step = "done";
      ctx.reply(
      `
      ✅ تم تسجيل الطلب:\n` +
        `📚 *الكتاب:* ${state.bookTitle}\n` +
        `🔢 *الكمية:* ${state.quantity}\n` +
        `👤 *الإسم:* ${state.name}\n` +
        `📱 *رقم الهاتف:* ${state.phone}\n` +
        `🏠 *عنوان التسليم:* ${state.address}
      `, {parse_mode: "Markdown"}
      )
      delete orderState[userId];
      break;
    }
    default: {
      ctx.reply("⚠️ لتسجيل طلب أدخل: \n /talab");
    }
  }
});

bot.launch();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
});