import 'dotenv/config';
import {Telegraf} from 'telegraf';
import { DataRepository } from './repository.mjs';
import { Model } from './model.mjs';

const MILISECONDS_PER_HOUR = 60 * 60 * 1000;
const {
  GIST_ID,
  GITHUB_TOKEN,
  TELEGRAM_TOKEN,
} = process.env;
const URL = 'https://radiant-fortress-05622.herokuapp.com';
const bot = new Telegraf(TELEGRAM_TOKEN);

const repository = DataRepository({
  gist_id: GIST_ID,
  github_token: GITHUB_TOKEN,
  file_name: 'eructin.json'
});

const model = Model(repository);

model.sync({interval: MILISECONDS_PER_HOUR});

const removeMessage = (ctx) => {
  ctx.deleteMessage(ctx.update.message.message_id).catch(noop);
};

const noop = () => {};

const types = [{
  text: "👍",
}, {
  text: "👎",
}, {
  text: "🔝",
}, {
  text: "🔥",
}, {
  text: "🤮",
}, {
  text: "🗣️",
}]

const drawButton = (votes, typeId) => {
  const {text} = types[typeId];
  return {
    text: `${text} ${votes}`,
    callback_data: typeId,
  }
};

const drawButtons = (messageVotes) => {
  let currentButtonPartition;
  return messageVotes.reduce(
    (buttons, votes, typeId) => {
      if (typeId % 3 === 0) {
        currentButtonPartition = []
        buttons.push(currentButtonPartition);
      }
      currentButtonPartition.push(drawButton(votes, typeId))
      return buttons;
    },
    []
  )
};

bot.on('text', removeMessage);
bot.on('document', removeMessage);
bot.on('contact', removeMessage);
bot.on('dice', removeMessage);
bot.on('game', removeMessage);
bot.on('photo', removeMessage);
bot.on('poll_answer', removeMessage);
bot.on('poll', removeMessage);
bot.on('sticker', removeMessage);
bot.on('venue', removeMessage);
bot.on('video_note', removeMessage); 
bot.on('voice', async (ctx) => {
  const message = ctx.update.message;
  const messageVotes = await model.getMessageVotes(message.message_id)
  ctx.reply(`Vota el eructo de @${message.from.username}`, {
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: drawButtons(messageVotes)
    }
  })
  .catch(noop);
});
bot.on('callback_query', async (ctx) => {
  const callback_query = ctx.update.callback_query;
  const replyToMessage = callback_query.message.reply_to_message;
  const voiceId = replyToMessage.message_id;
  const typeId = callback_query.data;
  await model.addVote(
    voiceId,
    callback_query.from.id,
    typeId
  );
  const messageVotes = await model.getMessageVotes(voiceId)
  ctx.editMessageReplyMarkup({
    inline_keyboard: drawButtons(messageVotes)
  }, {
    chat_id: callback_query.from.id, 
    message_id: callback_query.message.message_id
  }).catch(noop);
  ctx.answerCbQuery().catch(noop);

});

const stop = (signal) => {
  console.log('stop', signal);
  bot.stop(signal);
  model.stop();
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

const launchBot = () => {
  if (process.env.NODE_ENV === 'production') {
    const PORT = process.env.PORT || 3000;
    bot.telegram.setWebhook(`${URL}/bot${TOKEN}`);
    bot.startWebhook(`/bot${TOKEN}`, null, PORT)
  } else {
    bot.launch()
  }
}

launchBot()


