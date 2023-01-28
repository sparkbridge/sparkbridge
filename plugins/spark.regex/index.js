const { read } = require("../../handles/file");
const { formatMsg } = require("../spark.mc");
const winston = require('winston');
const dayjs = require('dayjs');
let today = dayjs();

const logger = winston.createLogger({
	format: winston.format.printf((info) => {
		return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] spark.regex | ${info.message}`
	}),
	transports: [
		new winston.transports.Console()
	]
});
/**
 * 
 * @param {String} str 
 * @param {RegExpMatchArray} reg 
 * @returns 
 */
function buildString(str, reg) {
    var i = 0;
    reg.forEach(s => {
        str = str.replace(`\$${i}`, s);
        i++
    });
    return str;
}

/**
 * 
 * @param {String} cmd 
 */
function commandParse(cmd,reg,reply,_adapter){
    let items = cmd.split("|");
    if(items.length == 1){
        logger.warn(`执行正则表达式：${cmd} 遇到错误：参数不足，请写入参数`);
    }
    let _first = items[0];
    let _arg = items[1];
    switch(_first){
        case 'reply':
            let txt1 = buildString(_arg,reg);
            reply(txt1);
            break;
        case 'f': //f|114514:nmsl
            let t_and_a = _arg.split(':');
            if(t_and_a.length == 0){
                logger.warn(`执行正则表达式：${cmd} 遇到错误：参数不足，请指定私聊联系人`);
            }
            let target = t_and_a[0];
            let arg = t_and_a[1];
            _adapter.sendFriendMsg(Number(target),buildString(arg,reg))
            break;
        case 't':
            let t_and_m = _arg.split(':');
            let tp = t_and_m[0];
            let ms = t_and_m[1];
            if(tp == 'all'){
                mc.broadcast(buildString(ms,reg));
            }else{
                let top = mc.getPlayer(tp);
                if(top){
                    top.tell(buildString(ms,reg));
                }
            }
            break;
        case 's': //s|list:true
            let command = _arg;
            mc.runcmd(buildString(command,reg));
            break;
    }
}

function onStart(_adapter){
    let {group,admin} = JSON.parse(read('./plugins/sparkbridge/spark.mc/config.json'));
    let config = JSON.parse(read('./plugins/sparkbridge/'+info().name+'/config.json'));
    const reply = (txt)=>{_adapter.sendGroupMsg(group,txt);}
    _adapter.on('bot.message.group',(e)=>{
        if(e.group !== group)return;
        let raw = formatMsg(e.message);
        for(let reg_it in config){
            let tmp = raw.match(reg_it);
            if (tmp == null) continue;
            if(config[reg_it].adm && !admin.includes(e.sender.user_id)){
                return;
            }
            try{
                config[reg_it].cmd.split(';').forEach(regtmp=>{
                    commandParse(regtmp,tmp,reply,_adapter);
                })
            }catch(err){
                console.log(err);
            }
        }
    })
}


function info(){
    return {
        name:'spark.regex',
        author:'lition',
        desc:'适用于sparkbridge的正则表达式模块',
        version: [0,0,1]
    }
}

module.exports = {onStart,info}