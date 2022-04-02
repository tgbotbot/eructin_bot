const parseData = (data) => new Map(data.map(
  ([messageId, votes]) => [
    messageId,
    votes.map(vote => new Set(vote))
  ]
));

const formatData = (dataMap) => [...dataMap].map(
  ([messageId, votes]) => [
    messageId,
    votes.map(vote => [...vote])
  ]
);

export const Model = (repository) => {
  let data = null;
  let intervalId = null;
  const getData = async () => {
    return data = data || parseData(await repository.get());
  }
  const getVotesOfType = (votesOfType) => votesOfType ? votesOfType.size : 0;
  return {
    async addVote(voiceMessageId, userId, typeId) {
      const data = await getData();
      let messageVotes = data.get(voiceMessageId);
      if (!messageVotes) {
        messageVotes = [];
        data.set(voiceMessageId, messageVotes)
      }
      messageVotes[typeId] = (messageVotes[typeId] || new Set()).add(userId)
    },
    async getMessageVotes(voiceMessageId) {
      const data = await getData();
      const messageVotes = data.get(voiceMessageId) || [];
      return Array.from(
        {length: 6},
        (_, typeId) => getVotesOfType(messageVotes[typeId])
      );
    },
    sync({interval}) {
      intervalId = setInterval(async () => {
        const data = await getData();
        await repository.set(formatData(data || new Map()));
      }, interval)
    },
    stop() {
      clearInterval(intervalId);
    }
  }
}