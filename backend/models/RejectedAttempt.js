import mongoose from 'mongoose';
const schema=new mongoose.Schema({date:{type:Date,default:Date.now},type:{type:String,default:'Outward'},materialCode:String,requestedQty:Number,availableQty:Number,reference:String,reason:String},{timestamps:true});
export default mongoose.model('RejectedAttempt',schema);
