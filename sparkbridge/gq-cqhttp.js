const { WebSocket } = require('ws');
const EventEmitter = require("events");
class Client {
    qq;
    log_level;
    platform;
    eventEmitter = new EventEmitter();
    /**
     * @type {WebSocket}
     */
    ws;
    constructor(qid, platform, log_level) {
        this.qq = qid;
        this.log_level = log_level;
        this.platform = platform;
    }
    login(pwd) {
        this.ws = new WebSocket(this.platform,{headers:{Authorization:pwd}});
    }
    on(evt,cb){
        this.eventEmitter.on(evt,cb);
    }
    off(evt,cb){
        this.eventEmitter.off(evt,cb);
    }
}

/*
{
  _post_method: 2,
  meta_event_type: 'lifecycle',
  post_type: 'meta_event',
  self_id: 2582152047,
  sub_type: 'connect',
  time: 1674650802
}

{
  post_type: 'meta_event',
  meta_event_type: 'heartbeat',
  time: 1674651992,
  self_id: 2582152047,
  status: {
    app_enabled: true,
    app_good: true,
    app_initialized: true,
    good: true,
    online: true,
    plugins_good: null,
    stat: {
      packet_received: 197,
      packet_sent: 137,
      packet_lost: 0,
      message_received: 47,
      message_sent: 0,
      disconnect_times: 0,
      lost_times: 0,
      last_message_time: 1674651977
    }
  },
  interval: 5000
}
{
  post_type: 'message',
  message_type: 'private',
  time: 1674652016,
  self_id: 2582152047,
  sub_type: 'friend',
  user_id: 2959435045,
  target_id: 2582152047,
  message: 'hi',
  raw_message: 'hi',
  font: 0,
  sender: { age: 0, nickname: 'skion', sex: 'unknown', user_id: 2959435045 },
  message_id: 2133854227
}
{
  post_type: 'message',
  message_type: 'group',
  time: 1674652514,
  self_id: 2582152047,
  sub_type: 'normal',
  font: 0,
  message: '[CQ:image,file=c7e6c4ed5a6db5fe29481c84ba98e6b5.image,subType=1,url=https://gchat.qpic.cn/gchatpic_new/2959435045/519916681-2852515958-C7E6C4ED5A6DB5FE29481C84BA98E6B5/0?term=3&amp;is_origin=0]',
  message_seq: 5120,
  raw_message: '[CQ:image,file=c7e6c4ed5a6db5fe29481c84ba98e6b5.image,subType=1,url=https://gchat.qpic.cn/gchatpic_new/2959435045/519916681-2852515958-C7E6C4ED5A6DB5FE29481C84BA98E6B5/0?term=3&amp;is_origin=0]',
  user_id: 2959435045,
  anonymous: null,
  group_id: 519916681,
  sender: {
    age: 0,
    area: '',
    card: '',
    level: '',
    nickname: 'skion',
    role: 'owner',
    sex: 'unknown',
    title: '',
    user_id: 2959435045
  },
  message_id: 590357373
}
*/

module.exports = {Client};