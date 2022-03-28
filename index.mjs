import 'dotenv/config';
import {Telegraf} from 'telegraf';
import pokemon from 'pokemon';

const TOKEN = process.env.TOKEN;
const bot = new Telegraf(TOKEN);
bot.command('random', (ctx) => {
    ctx.reply(pokemon.getName(Math.floor(152 * Math.random())))
})

const removeMessage = (ctx) => {
  ctx.deleteMessage(ctx.update.message.message_id).catch(noop);
};

const noop = () => {};

const OK_TYPE = 'OK';
const BAD_TYPE = 'BAD';
const TOP_TYPE = 'TOP';
const FIRE_TYPE = 'FIRE';
const HORRIBLE_TYPE = 'HORRIBLE';
const WONDERFUL_TYPE = 'WONDERFUL';

const dataBase = {
  [OK_TYPE]: {
    text: "👍",
    votes: {}
  },
  [BAD_TYPE]: {
    text: "👎",
    votes: {}
  },
  [TOP_TYPE]: {
    text: "🔝",
    votes: {}
  },
  [FIRE_TYPE]: {
    text: "🔥",
    votes: {}
  },
  [HORRIBLE_TYPE]: {
    text: "🤮",
    votes: {}
  },
  [WONDERFUL_TYPE]: {
    text: "🗣️",
    votes: {}
  }
};

const drawButton = (voiceMessageId, type) => {
  const {text, votes} = dataBase[type];
  return {
    text: `${text} ${votes[voiceMessageId] || ''}`,
    callback_data: type,
  }
};

const drawButtons = (voiceMessageId) => {
  let currentButtonPartition;
  return Object.keys(dataBase).reduce(
    (buttons, type, index) => {
      if (index % 3 === 0) {
        currentButtonPartition = []
        buttons.push(currentButtonPartition);
      }
      currentButtonPartition.push(drawButton(voiceMessageId, type))
      return buttons;
    },
    []
  )
};

const addVote = (voiceMessageId, type) => {
  const votes = dataBase[type].votes;
  votes[voiceMessageId] = (votes[voiceMessageId] || 0) + 1;
}


bot.on('text', removeMessage);
bot.on('document', removeMessage);
bot.on('contact', removeMessage);
bot.on('dice', removeMessage);
bot.on('game', removeMessage);
bot.on('photo', removeMessage);
bot.on('poll_answer', removeMessage);
//bot.on('poll', removeMessage);
bot.on('sticker', removeMessage);
bot.on('venue', removeMessage);
bot.on('video_note', removeMessage); 
bot.on('voice', (ctx) => {
  const message = ctx.update.message;
  ctx.reply(`Vota el eructo de @${message.from.username}`, {
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: drawButtons(message.message_id)
    }
  })
  .catch(noop)
});
bot.on('callback_query', (ctx) => {
  const callback_query = ctx.update.callback_query;
  const voiceId = callback_query.message.reply_to_message.message_id;
  const voteType = callback_query.data;
  addVote(voiceId, voteType);
  ctx.editMessageReplyMarkup({
    inline_keyboard: drawButtons(voiceId)
  }, {
    chat_id: callback_query.from.id, 
    message_id: callback_query.message.message_id
  }).catch(noop);
  ctx.answerCbQuery().catch(noop);

})

bot.launch();
const restart = (signal) => {
  console.log('stop', signal);
  bot.stop(signal);
  bot.launch();
}

process.on('SIGINT', () => {restart('SIGINT'));
process.on('SIGTERM', () => restart('SIGTERM'));
process.on('SIGKILL', () => restart('SIGKILL'));