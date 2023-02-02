//LiteLoaderScript Dev Helper
/// <reference path="c:\Users\86158\Documents/dts/llaids/src/index.d.ts"/> 

const ME = require('./package.json');
const JSON5 = require('json5');
const winston = require('winston');
const dayjs = require('dayjs');
const { Adapter } = require('sparkbridge-core');
const path = require('path');
let today = dayjs();


ll.registerPlugin(
    /* name */ ME.name,
    /* introduction */ ME.description,
    /* version */ ME.version.split('.'),
    /* otherInformation */ {}
);

const logger = winston.createLogger({
    format: winston.format.printf((info) => {
        return `${today.format("YYYY-MM-DD h:mm:ss")} [${info.level}] SparkBridge | ${info.message}`
    }),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `./plugins/sparkbridge/logs/${today.format("YYYY-MM-DD")}.log` })
    ]
});

const file = require('./handles/file');
const JSON_PATH = './plugins/sparkbridge/config.json';

if (file.exists(JSON_PATH) == false) {
    file.mkdir('./plugins/sparkbridge/');
    file.copy('./plugins/nodejs/sparkbridge/config.json', JSON_PATH);
}


mc.listen('onServerStarted', () => {
    // 服务器开启，开始执行
    
    let config = JSON5.parse(file.read('./plugins/sparkbridge/config.json'));
    let { adapter, qq } = config;
    logger.info('SparkBridge载入中...VERSION:1.0.6');

    logger.info(`准备使用适配器：${adapter.type} 登录账号：${qq.qid}`);
    let _adapter = new Adapter(adapter.type, qq.qid, qq.platform, qq.log_level,adapter.target);
    _adapter.createClient();

    const cmd = mc.newCommand("spark","sparkbridge command",PermType.GameMasters);
    cmd.setEnum("LoginAction", ["slider"]);
    cmd.setEnum("ListAction", ["login"]);
    cmd.mandatory("action", ParamType.Enum, "LoginAction", 1);
    cmd.mandatory("action", ParamType.Enum, "ListAction", 1);
    cmd.mandatory("tickit", ParamType.RawText);
    cmd.overload(["LoginAction", "tickit"]);
    cmd.overload(["ListAction"]);
    cmd.setCallback((_cmd, _ori, out, res) => {
        switch (res.action) {
            case "slider":
                if(adapter.type  == 'oicq'){
                    _adapter.client.client.submitSlider(res.tickit);
                }else{
                    return out.error("此方法在gocq环境下不可用");
                }
            case "login":
                if(adapter.type  == 'oicq'){
                    _adapter.client.client.login();
                }else{
                    return out.error("此方法在gocq环境下不可用");
                }
        }
    });
    cmd.setup();
    logger.info('若需要提交ticket请使用spark slider <ticket> 进行提交，扫码后输入spark login进行登录');
    _adapter.login(qq.pwd);
    _adapter.once('bot.online', () => {
        logger.info('上线成功，开始加载插件');
        const PLUGINS_PATH = path.join(__dirname, 'plugins\\');
        const plugins_list = file.listdir(PLUGINS_PATH);
        for (let pl in plugins_list) {
            let _name = plugins_list[pl];
            try {
                if(file.exists(PLUGINS_PATH+_name+'\\config.json')){
                    if(file.exists('./plugins/sparkbridge/'+_name+'/config.json') == false){
                        file.mkdir('./plugins/sparkbridge/'+_name);
                        file.mkdir('./plugins/sparkbridge/'+_name+'/data/');
                        file.copy(PLUGINS_PATH+_name+'\\config.json','./plugins/sparkbridge/'+_name+'/config.json');
                    }
                }
                let pl_obj = require('./plugins/'+_name);
                const {name,author} = pl_obj.info();
                logger.info(`加载 ${name}`);
                pl_obj.onStart(_adapter);
                logger.info(`${name} 加载完成，作者：${author}`);
            } catch (err) {
                console.log(err);
                logger.error(`插件 ${_name} 加载失败`);
            }
        }
    })
})