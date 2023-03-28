var sockets = {};

function pushSocket(nickname, socketID) {
    sockets[nickname] = socketID;
}

function popSocket(nickname) {
    delete sockets[nickname];
}

function find(nickname) {
    return sockets[nickname];
}
function getSocket(nickname) {
    return sockets[nickname];
}

function getSocketId(socketID) {
    for (let sock in sockets) {
        if (sockets[sock.nickname] == socketID) {
            return sock;
        }
    }
}

function getSocketList() {
    return sockets;
}

module.exports = { pushSocket, getSocket, getSocketList, getSocketId, popSocket, find };