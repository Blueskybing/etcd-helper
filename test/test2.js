/**
 * Created by bluesky on 15-11-30.
 */


var Etcd = require('node-etcd');
var etcd = new Etcd(['203.195.136.32:2379', '119.29.40.144:2379', '182.254.234.220:2379']);
console.log(etcd);
console.log(etcd.getSync('/yuwan/mysql/development/master/').body.node.value);
console.log(etcd.getSync('/yuwan/mysql/development/slave/').body.node.value);
console.log(etcd.getSync('/yuwan/mysql/test/master/').body.node.value);
console.log(etcd.getSync('/yuwan/mysql/test/slave/').body.node.value);
console.log(etcd.getSync('/yuwan/mysql/production/master/').body.node.value);
console.log(etcd.getSync('/yuwan/mysql/production/slave/').body.node.value);