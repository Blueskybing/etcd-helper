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
        setConfig:function(params) {
            if (!params) {
                return;
            }
            setMysqlConfig(etcd, params['mysql'] || '');
            setRedisConfig(etcd, params['redis'] || '');
        },
        setMysqlConfig: function (params) {
            if (!params) {
                return;
            }
            setMysqlConfig(etcd, params['mysql'] || '');
        },
        setRedisConfig: function (params) {
            if (!params) {
                return;
            }
            setRedisConfig(etcd, params['redis'] || '');
        },
        watcherMysqlConfig: function (params) {
            //监听 mysql
            for (var i = 0; i < params['mysql'].length; i++) {
                watcherMysql(etcd, params['mysql'][i]);
            }
        },
        watcherRedisConfig: function (params) {
            // 监听 redis
            watcherRedis(etcd, params['redis']);
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
        assignment(params[i].config, obj);
    }
    console.log('设置mysql配置完成...');
}

/**
 *  给对象赋值
 * @param config
 * @param obj
 */
function assignment(config, obj) {
    for (var key in config) {
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
function watcherMysql(etcd, param) {
    console.log('监听--->' + param.path)
    // 监听每个路径,一旦发生改变将做相应操作
    var watcher = etcd.watcher(param.path);
    watcher.on("change", function (data) {
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
        // 改变配置
        assignment(param.config, JSON.parse(data.node.value));
        console.log('监听到mysql配置发生改变重新加载配置...');
        console.log('开始重新初始化mysql数据库连接池...');
        // 重新初始化数据库连接池.
        for (var key in param.config) {
            param.db_pool[key] = mysql.createPool(param.config[key]);
        }
        console.log('重新初始化mysql数据库连接池成功...');
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

function watcherRedis(etcd, param) {
    console.log('监听--->' + param.path)
    // 监听路径,一旦发生改变将做相应操作
    var watcher = etcd.watcher(param.path);
    watcher.on("change", function (data) {
        // 关闭连接
        if (!param.client) {
            console.log('redis client对象不能为空');
            return;
        }
        param.client.end();
        // 改变配置
        console.log('监听到redis配置发生改变重新加载配置...');
        console.log('开始重新初始化redis...');
        var obj = JSON.parse(data.node.value);
        param.config['redis_host'] = obj['redis_host'];
        param.config['redis_port'] = obj['redis_port'];
        param.config['redis_pass'] = obj['redis_pass'];

        // 重新初始化数据库连接池.
        var redis = require("redis"),
            client = redis.createClient(param.config.redis_port, param.config.redis_host);
        client.auth(param.config.redis_pass);
        if (!param.selectNum) {
            client.select(param.selectNum);
        }
        param.client = client;
        console.log('重新初始化redis成功...');
    });
}
module.exports = EtcdHelper;