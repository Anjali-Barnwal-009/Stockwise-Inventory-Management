import mongoose from 'mongoose';
const transactionSchema=new mongoose.Schema({
  date:{type:Date,required:true},
  type:{type:String,enum:['Inward','Outward'],required:true},
  material:{type:mongoose.Schema.Types.ObjectId,ref:'Material',required:true},
  materialCode:{type:String,required:true},
  materialName:{type:String,required:true},
  qty:{type:Number,required:true,min:0.000001},
  reference:{type:String,default:'-'},
  balanceAfter:{type:Number,required:true,min:0},
},{timestamps:true});
export default mongoose.model('Transaction',transactionSchema);
