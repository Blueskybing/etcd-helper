/*
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
 new Etcd(['xxx.xxx.xxx.xxx:xxxx', 'xxx.xxx.xxx.xxx:xxxx', 'xxx.xxx.xxx.xxx:xxxx']).setMysqlConfig(params);


 console.log(params.mysql[0].config);
 console.log(params);
 */

/*
 var a = 'sd';

 console.log(a.indexOf('a'))*/

var a = {'a': 1}

console.log(typeof a === 'object')
