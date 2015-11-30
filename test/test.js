var Etcd = require("../lib/etcd-helper");
var params = {
    mysql: [{
        path: '/yuwan/mysql/development/master/',
        config: {},
        db_pool: {}
    }],
    redis: {
        path: '/yuwan/redis/development/',
        config: {}
    }
};
new Etcd(['203.195.136.32:2379', '119.29.40.144:2379', '182.254.234.220:2379']).setConfig(params);
new Etcd(['203.195.136.32:2379', '119.29.40.144:2379', '182.254.234.220:2379']).watcherConfig(params);


console.log(params.mysql[0].config);
console.log(params);
