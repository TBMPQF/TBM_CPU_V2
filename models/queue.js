const queues = {};

module.exports = {
    addSong(serverId, song) {
        if (!queues[serverId]) {
            queues[serverId] = [];
        }
        queues[serverId].push(song);
    },

    getQueue(serverId) {
        return queues[serverId] || [];
    },

    clearQueue(serverId) {
        queues[serverId] = [];
    },

    removeFirstSong(serverId) {
        if (queues[serverId] && queues[serverId].length > 0) {
            return queues[serverId].shift();
        }
        return null;
    }
};