const queues = new Map();

module.exports = {
  get: (guildId) => queues.get(guildId),
  set: (guildId, queue) => queues.set(guildId, queue),
  has: (guildId) => queues.has(guildId),
};