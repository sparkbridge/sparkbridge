const {createClient} = require('oicq');
const crypto = require('crypto');
const md5 = crypto.createHash('md5');

class Client{
    qq;
    platform;
    online = false;
    client;
    constructor(qid,platform,log_level){
        this.qq = qid;
        this.platform = platform;
        this.client = createClient(qid,{platform,data_dir:`./plugins/sparkbridge/data/`,log_level});
    }
    login(pwd=null){
        this.client.on("system.login.qrcode", function (e) {
            //扫码后按回车登录
            process.stdin.once("data", () => {
                this.login()
            })
        })
        if(pwd){
            this.client.passwordLogin(Buffer.from(md5.update(pwd).digest('hex')));
        }else{
            this.client.qrcodeLogin();
        }
    }
    on(evt,func){
        return this.client.on(evt,func);
    }
    off(evt,func){
        return this.client.off(evt,func);
    }
}
/*
GroupMessage {
  post_type: 'message',
  message_id: 'KRwyRx94B18AAIkZN2i5p2PQr8cB',
  user_id: 527959903,
  time: 1674620871,
  seq: 35097,
  rand: 929610151,
  font: '宋体',
  message: [ { type: 'text', text: '他们的吗' } ],
  raw_message: '他们的吗',
  message_type: 'group',
  sender: {
    user_id: 527959903,
    nickname: 'cattle666',
    card: '',
    sex: 'unknown',
    age: 0,
    area: '',
    level: 1,
    role: 'member',
    title: '大牛'
  },
  group_id: 689713735,
  group_name: '猫猫吹牛群',
  block: false,
  sub_type: 'normal',
  anonymous: null,
  atme: false,
  atall: false,
  group: Group {},
  member: Member {},
  reply: [Function (anonymous)],
  recall: [Function (anonymous)],
  self_id: 2582152047
}

PrivateMessage {
  post_type: 'message',
  message_id: 'sGVlJQAAhpcy2hBnY9Cv7gA=',
  user_id: 2959435045,
  time: 1674620910,
  seq: 34455,
  rand: 853151847,
  font: '宋体',
  message: [ { type: 'text', text: '测试' } ],
  raw_message: '测试',
  message_type: 'private',
  sub_type: 'friend',
  sender: {
    user_id: 2959435045,
    nickname: 'skion',
    group_id: undefined,
    discuss_id: undefined
  },
  from_id: 2959435045,
  to_id: 2582152047,
  auto_reply: false,
  friend: Friend {},
  reply: [Function (anonymous)],
  self_id: 2582152047
}
PrivateMessage {
  post_type: 'message',
  message_id: 'sFso9AAAXvRWhbbyY9CwoAA=',
  user_id: 2958764276,
  time: 1674621088,
  seq: 24308,
  rand: 1451603698,
  font: '宋体',
  message: [ { type: 'face', id: 5, text: '流泪' } ],
  raw_message: '[流泪]',
  message_type: 'private',
  sub_type: 'group',
  sender: {
    user_id: 2958764276,
    nickname: '',
    group_id: 620604633,
    discuss_id: undefined
  },
  from_id: 2958764276,
  to_id: 2582152047,
  auto_reply: false,
  friend: Friend {},
  reply: [Function (anonymous)],
  self_id: 2582152047
}

 */


module.exports = {Client};