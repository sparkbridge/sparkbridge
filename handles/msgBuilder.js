class GroupMessageEvent {
    sender;
    message;
    group;
    raw_message;
    constructor(type, e) {
        this.message = Message(type,e.message);
        this.sender = Sender(type,e);
        this.group = Group(type,e);
        this.raw_message = Raw_Message(type,e);
    }
}

class FriendMessageEvent{
    sender;
    message;
    raw_message;
    constructor(type,e){
        this.message = Message(type,e.message);
        this.sender = Sender(type,e);
        this.raw_message = Raw_Message(type,e);
    }
}

function Raw_Message(type,e){
    return e.raw_message;
}
function Group(type,e){
    return e.group_id;            
}

function Sender(type, e) {
    switch (type) {
        case 'oicq':
            return e.sender;
        case 'gocq':
            return e.sender;
    }
}

class Builder {
    static text(raw) {
        return { type: 'text', text: raw };
    }
    static img(url) {
        return { type: 'img', url };
    }
    static at(qid){
        return {type:'at' , qq:qid}
    }
    static face(id){
        return {type:'face',id}
    }
}

function Message(type, e) {
    let re = [];
    switch (type) {
        case 'oicq':
            e.forEach(it => {
                switch (it.type) {
                    case 'at':
                        re.push(Builder.at(it.qq))
                        break;
                    case 'image':
                        re.push(Builder.img(it.url));
                        break;
                    case 'text':
                        re.push(Builder.text(it.text))
                        break;
                    case 'face':
                        re.push(Builder.face(it.id));
                        break;
                    
                }
            });
            break;
        case 'gocq':
            e.forEach(t => {
                switch (t.type) {
                    case 'text':
                        re.push(Builder.text(t.data.text));
                        break;
                    case 'image':
                        re.push(Builder.img(t.data.url));
                        break;
                    case 'at':
                        re.push(Builder.at(t.data.qq));
                        break;
                    case 'face':
                        re.push(Builder.face(t.data.id));
                        break;
                }
            })
            break;
    }
    return re;
}


module.exports = {
    GroupMessageEvent,
    FriendMessageEvent
}