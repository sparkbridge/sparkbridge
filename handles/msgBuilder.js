class GroupMessageEvent {
    sender;
    message;
    group;
    raw_message;
    constructor(_adapter,type, e) {
        this.message = Message(type,e.message);
        this.sender = Sender(type,e);
        this.group = Group(type,e);
        this.raw_message = Raw_Message(type,e);
        this.reply = Group_Reply(type,e,_adapter);
    }
}

class FriendMessageEvent{
    sender;
    message;
    raw_message;
    constructor(_adapter,type,e){
        this.message = Message(type,e.message);
        this.sender = Sender(type,e);
        this.raw_message = Raw_Message(type,e);
    }
}

class GroupLeftEvent{
    sub_type;
    group;
    operator;
    user;
    constructor(_adapter,type,e){
        this.group = Group(type,e);
        this.operator = e.operator_id;
        this.user = e.user_id;
        this.sub_type = e.sub_type;
    }
}

class GroupJoinEvent{
    sub_type;
    group;
    operator;
    user;
    constructor(_adapter,type,e){
        this.group = Group(type,e);
        this.operator = e.operator_id;
        this.user = e.user_id;
        this.sub_type = e.sub_type;
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

function Group_Reply(type,e,client){
    switch(type){
        case 'oicq':
            return e.reply;
        case 'gocq':
            return (msg)=>{
                const d = {
                    action: 'send_group_msg',
                    params:{
                        group_id : e.group_id,
                        message:[
                            {
                                type:'reply',
                                data:{
                                    id: e.message_id
                                }
                            },
                            {
                                type :'text',
                                data:{
                                    text:msg
                                }
                            }
                        ]
                    }
                }
                client.send(JSON.stringify(d));
            }
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
    FriendMessageEvent,
    GroupJoinEvent,
    GroupLeftEvent
}