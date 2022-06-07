const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const routeSchema = new Schema({
    line:Array,
    summary:Object
}, {timestamps:true})

const Route = mongoose.model('Route', routeSchema, 'routes');

module.exports = Route;
