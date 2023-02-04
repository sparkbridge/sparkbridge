const compressing = require('compressing');
const fs = require('fs');
const mkdir = fs.mkdirSync;
const del_file = fs.rmSync;

async function install(name) {
        let zip_path = './plugins/sparkbridge/plugins/' + name;

        let dir_name = name.split('.');
        dir_name.pop();
        dir_name = dir_name.join('.');
    
        logger.info(dir_name);

        let target_path = './plugins/nodejs/sparkbridge/plugins/' + dir_name;
        try {
            mkdir(target_path);
        } catch { }
        logger.info('开始安装'+name);
        await compressing.zip.uncompress(zip_path,target_path)
        logger.info(name+'解压完毕');
        del_file(zip_path);
        
}

module.exports = install;