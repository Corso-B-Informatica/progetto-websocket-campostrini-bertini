var sockets = {};

function pushSocket(id, socket) {
    sockets[id] = socket;
}

function getSocket(id) {
    return sockets[id];
}

function getSocketId(socket) {
    for (let sock in sockets) {
        if (sockets[sock] == socket) {
            return sock;
        }
    }
}

function getSocketList() {
    return sockets;
}

module.exports = { pushSocket, getSocket, getSocketList, getSocketId };