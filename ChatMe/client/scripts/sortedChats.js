class sortedChats  {
    chats = [];
    selectedChat = -1;

    constructor() {
        this.chats = [];
        this.selectedChat = -1;
    }
    
    addAll(chats) {
        this.chats = chats;
        return this.chats;
    }

    add(chat) {
        this.chats.push(chat);
        return this.chats;
    }
    
    remove(chatId) {
        this.chats = this.chats.filter((chat) => chat._id !== chatId);
    }
    
    get() {
        return this.chats;
    }

    get(index) {
        return this.chats[index];
    }

    clear() {
        this.chats = [];
    }

    selectedChat(index) {
        this.selectedChat = index;
    }

    getSelectedChat() {
        return this.selectedChat;
    }

    size() {
        return this.chats.length;
    }
    
    sort() {
        var scambio = true;
        for (let i = 0; i < chats.length - 1 && scambio; i++) {
            scambio = false;
            for (let j = 0; j < chats.length - 1 - i; j++) {
                if (new Date(chats[j].nonVisualized[chats[j].nonVisualized.length - 1].date) > new Date(chats[j].nonVisualized[chats[j + 1].nonVisualized.length - 1].date)) {
                    var chat = chats[j];
                    chats[j] = chats[j + 1];
                    chats[j + 1] = chat;
                    scambio = true;
                }
            }
        }
    }
}