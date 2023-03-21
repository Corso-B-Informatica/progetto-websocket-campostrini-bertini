var sockets = {};

function pushSocket(id, socket) {
    sockets[id] = socket;
}

function getSocket(id) {
    return sockets[id];
}

module.exports = { pushSocket, getSocket };