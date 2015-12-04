/**
 * Created by Bluesky on 2015/11/30.
 */
"use strict";
var Etcd = require('node-etcd');
var mysql = require('mysql');

/**
 * 初始化etcd
 * @param address 地址数组，如:['地址1','地址2']
 * @param params {"mysql":["path":'/test/test',"config":{},"db_pool":{}]，"redis":{}}
 * @constructor
 */
function EtcdHelper(address) {
    var etcd = new Etcd(address);
    return {
        //设置Mysql和Redis配置
        setConfig: function (params) {
            if (!params) {
                return;
            }
            setMysqlConfig(etcd, params['mysql'] || '');
            setRedisConfig(etcd, params['redis'] || '');
        },
        //设置Mysql配置
        setMysqlConfig: function (params) {
            if (!params) {
                return;
            }
            setMysqlConfig(etcd, params['mysql'] || '');
        },
        // 设置Redis配置
        setRedisConfig: function (params) {
            if (!params) {
                return;
            }
            setRedisConfig(etcd, params['redis'] || '');
        },
        //监听 mysql
        watcherMysqlConfig: function (params, callback) {
            for (var i = 0; i < params['mysql'].length; i++) {
                watcherMysql(etcd, params['mysql'][i], callback);
            }

        },
        // 监听 redis
        watcherRedisConfig: function (params, callback) {
            watcherRedis(etcd, params['redis'], callback);
        }
    }
}

/**
 * 设置mysql配置
 * @param etcd
 * @param param
 */
function setMysqlConfig(etcd, params) {
    if (!params) {
        return;
    }
    for (var i = 0; i < params.length; i++) {
        var obj = JSON.parse(etcd.getSync(params[i].path).body.node.value);
        assignment(params[i], obj);
    }
    console.log('设置mysql配置完成...');
}

/**
 *  给对象赋值
 * @param config
 * @param obj
 */
function assignment(param, obj) {
    var config = param.config;
    for (var key in config) {
        if (config[key] && config[key]['master_slave']
            && param.path.indexOf(config[key]['master_slave'].toLocaleLowerCase()) < 0) {
            continue;
        }
        if (typeof config[key] !== 'object') {
            continue;
        }
        config[key]['host'] = obj['host'];
        config[key]['port'] = obj['port'];
        config[key]['user'] = obj['user'];
        config[key]['password'] = obj['password'];
    }
}

/**
 * 监听
 * @param etcd
 * @param param
 */
function watcherMysql(etcd, param, callback) {
    console.log('监听--->' + param.path)
    // 监听每个路径,一旦发生改变将做相应操作
    var watcher = etcd.watcher(param.path);
    watcher.on("change", function (data) {
        console.log('监听到mysql配置发生改变重新加载配置...', param.config);
        // 改变配置
        assignment(param, JSON.parse(data.node.value));
        if (typeof callback == 'function') {
            callback(param);
        } else {
            console.log('关闭所有数据库连接池...');
            if (!param.db_pool) {
                console.log('mysql db_pool对象不能为空');
                return;
            }
            // 关闭所有数据库连接池
            for (var key in param.config) {
                if (!param.db_pool[key]) {
                    continue;
                }
                param.db_pool[key].end();
            }
            console.log('开始重新初始化mysql数据库连接池...');
            // 重新初始化数据库连接池.
            for (var key in param.config) {
                param.db_pool[key] = mysql.createPool(param.config[key]);
            }
            console.log('重新初始化mysql数据库连接池成功...');
        }
    });
}

function setRedisConfig(etcd, param) {
    if (!param.path) {
        return;
    }
    var obj = JSON.parse(etcd.getSync(param.path).body.node.value);
    param.config['redis_host'] = obj['redis_host'];
    param.config['redis_port'] = obj['redis_port'];
    param.config['redis_pass'] = obj['redis_pass'];
    console.log('设置redis配置完成...');
}

function watcherRedis(etcd, param, callback) {
    console.log('监听--->' + param.path)
    // 监听路径,一旦发生改变将做相应操作
    var watcher = etcd.watcher(param.path);
    watcher.on("change", function (data) {
        // 改变配置
        var obj = JSON.parse(data.node.value);
        param.config['redis_host'] = obj['redis_host'];
        param.config['redis_port'] = obj['redis_port'];
        param.config['redis_pass'] = obj['redis_pass'];
        console.log('监听到redis配置发生改变重新加载配置...', param.config);
        console.log('开始重新初始化redis...');
        if (typeof callback == 'function') {
            callback(param);
        } else {
            console.log('关闭所有mysql连接...');
            // 关闭连接
            if (!param.client) {
                console.log('redis client对象不能为空');
                return;
            }
            param.client.end();
            // 重新初始化数据库连接池.
            var redis = require("redis"),
                client = redis.createClient(param.config.redis_port, param.config.redis_host);
            client.auth(param.config.redis_pass);
            if (!param.selectNum) {
                client.select(param.selectNum);
            }
            param.client = client;
            console.log('重新初始化redis成功...');
        }
    });
}
module.exports = EtcdHelper;

