const EventEmitter = require("events");
const cl_oicq = require('./oicq').Client;
const cl_gocq = require('./gq-cqhttp').Client;

const { segment } = require("oicq")
const winston = require('winston');
const dayjs = require('dayjs');
const { exists } = require("../handles/file");
const { GroupMessageEvent, FriendMessageEvent, GroupLeftEvent, GroupJoinEvent } = require("../handles/msgBuilder");
let today = dayjs();
class Adapter {
    type = 'oicq';
    client;
    qq;
    platform;
    log_level;
    logger;
    target;
    pwd;
    eventEmitter = new EventEmitter();
    constructor(type, qq, platform, log_level, target) {
        this.logger = winston.createLogger({
            format: winston.format.printf((info) => {
                return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] ${this.qq} | ${info.message}`
            }),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: `./plugins/sparkbridge/logs/${today.format("YYYY-MM-DD")}.log` })
            ]
        });
        this.type = type;
        this.qq = qq;
        this.platform = platform;
        this.log_level = log_level;
        this.target = target;
    }
    createClient() {
        switch (this.type) {
            case "oicq":
                this.client = new cl_oicq(this.qq, this.platform, this.log_level);
                break;
            case 'gocq':
                this.client = new cl_gocq(this.qq, this.target, this.log_level);
                break;
            default:
                throw new Error('此类型还未适配');
        }
    }
    login(pwd = null) {
        this.pwd = pwd;
        this.client.login(pwd);
        switch (this.type) {
            case 'oicq':
                this.client.on('system.online', () => {
                    this.eventEmitter.emit('bot.online');
                    this.logger.info('登录成功，开始处理事件');
                    this.client.on('message', (e) => {
                        this.eventEmitter.emit('bot.pre.message', e);
                    });
                    this.client.on('message.group', (e) => {
                        this.logger.info(`${e.group_name} ${e.sender.nickname} >> ${e.raw_message}`);
                        this.eventEmitter.emit('bot.message.group',new GroupMessageEvent(this.client.client,this.type,e));
                        this.eventEmitter.emit('bot.pre.message.group', e);
                    });
                    this.client.on('message.private', (e) => {
                        this.eventEmitter.emit('bot.pre.message.private', e);
                        this.eventEmitter.emit('bot.message.private',new FriendMessageEvent(this.client.client,this.type,e));
                    });
                    this.client.on('notice.group.increase', (e)=>{
                        this.eventEmitter.emit('bot.pre.notice.group.increase',e);
                        this.eventEmitter.emit('bot.notice.group.increase',new GroupJoinEvent(this.client.client,this.type,e));
                    });
                    this.client.on('notice.group.decrease' ,(e)=>{
                        this.eventEmitter.emit('bot.pre.notice.group.decrease',e);
                        this.eventEmitter.emit('bot.notice.group.decrease',new GroupLeftEvent(this.client.client,this.type,e));
                    });
                })
                break;
            case 'gocq':
                this.logger.info('开始连接 websocket 到 go-cqhttp');
                this.client.ws.on('open',()=>{
                    this.logger.info('登录成功，开始处理事件');
                    this.eventEmitter.emit('bot.online');
                });
                this.client.ws.on('error',(e)=>{
                    this.logger.error('websocket 故障！！');
                    this.logger.error('请检查连接到go-cqhttp的密钥是否填写正确');
                    console.log(e);
                })
                this.client.ws.on('close',(e)=>{
                    this.logger.warn('websocket 已经断开');
                    setTimeout(()=>{
                        this.login(this.pwd)
                    },3e3);
                })
                this.client.ws.on('message', (_data, _islib) => {
                    let raw = _data;;
                    if (_islib) {
                        raw = _data.toString()
                    }
                    const msg_obj = JSON.parse(raw);
                    console.log(msg_obj);
                    switch(msg_obj.post_type){
                        case 'meta_event':
                            if(msg_obj.self_id != this.qq){
                                this.eventEmitter.emit('bot.login.fail');
                                throw new Error('登录的QQ号与go-cqhttp中不符合');
                            }
                            break;
                        case 'notice':
                            this.eventEmitter.emit('bot.pre.notice',msg_obj);
                            switch(msg_obj.notice_type){
                                case 'group_increase':
                                    this.eventEmitter.emit('bot.pre.notice.group.increase',msg_obj);
                                    this.eventEmitter.emit('bot.notice.group.increase',new GroupJoinEvent(this.client.ws,this.type,msg_obj));
                                    break;
                                case 'group_decrease':
                                    this.eventEmitter.emit('bot.pre.notice.group.decrease',msg_obj);
                                    this.eventEmitter.emit('bot.notice.group.decrease',new GroupLeftEvent(this.client.ws,this.type,msg_obj));
                                    break;
                            }
                            break;
                        case 'message':
                            this.eventEmitter.emit('bot.pre.message',msg_obj);
                            switch(msg_obj.message_type){
                                case 'private':
                                    try{
                                        this.eventEmitter.emit('bot.pre.message.private',msg_obj);
                                        this.eventEmitter.emit('bot.message.private',new FriendMessageEvent(this.client.ws,this.type,msg_obj));
                                    }catch(err){
                                        this.logger.error('解析私聊消息消息出现异常');
                                        console.log(err);
                                    }
                                    break;
                                case 'group':
                                    try{
                                        this.eventEmitter.emit('bot.pre.message.group',msg_obj);
                                        this.eventEmitter.emit('bot.message.group',new GroupMessageEvent(this.client.ws,this.type,msg_obj));
                                    }catch(err){
                                        this.logger.error('解析群聊消息消息出现异常');
                                        console.log(err);
                                    }
                                    break;
                            }
                            break;
                        default:
                            //this.logger.info(`${msg_obj.post_type} ${JSON.stringify(msg_obj)}`);
                            break;
                    }
                })
                break;
        }
    }
    on(evt, cb) {
        this.eventEmitter.on(evt, cb);
    }
    off(evt, cb) {
        this.eventEmitter.off(evt, cb);
    }
    once(evt, cb) {
        this.eventEmitter.once(evt, cb);
    }
    sendGroupMsg(gid, msg) {
        switch (this.type) {
            case 'oicq':
                return this.client.client.pickGroup(gid).sendMsg(msg);
            case 'gocq':
                if (typeof msg == 'string') {
                    msg = [this.text(msg)];
                }
                for (let e in msg) {
                    let tmp = msg[e];
                    if (typeof tmp == 'string') {
                        msg[e] = this.text(tmp)
                    }
                }
                //console.log(msg)
                return this.client.ws.send(JSON.stringify({
                    action: 'send_group_msg',
                    params: {
                        group_id: gid,
                        message: msg
                    }
                }));
        }
    }
    sendFriendMsg(fid, msg) {
        switch (this.type) {
            case 'oicq':
                return this.client.client.pickFriend(fid).sendMsg(msg);
            case 'gocq':
                return this.client.ws.send(JSON.stringify({
                    action: 'send_private_msg',
                    params: {
                        user_id: fid,
                        message: msg
                    }
                }));
        }
    }
    img(file) {
        switch (this.type) {
            case 'oicq':
                return segment.image(file);
            case 'gocq':
                if(exists(file)){
                    return { type: 'image', data: { file:'file:///'+file } }
                }else{
                    return { type: 'image', data: { file:file, subType:0} }
                    // 暂时只能使用file进行发送
                    // 详见https://github.com/Mrs4s/go-cqhttp/issues/1660
                }
        }
    }
    at(qid) {
        switch (this.type) {
            case 'oicq':
                return segment.at(qid);
            case 'gocq':
                return { type: "at", data: { "qq": qid } };
        }
    }
    text(raw) {
        return { type: 'text', data: { text: raw } };
    }
}

module.exports = { Adapter };