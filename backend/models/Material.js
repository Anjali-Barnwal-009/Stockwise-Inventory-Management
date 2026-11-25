import mongoose from 'mongoose';
const materialSchema=new mongoose.Schema({
  code:{type:String,unique:true,required:true,trim:true},
  name:{type:String,required:true,trim:true},
  unit:{type:String,required:true,enum:['KG','Meter','Nos','Litre','Piece','Box']},
  openingQty:{type:Number,required:true,min:0},
  availableQty:{type:Number,required:true,min:0},
},{timestamps:true});
materialSchema.virtual('stockStatus').get(function(){return this.availableQty===0?'Out of Stock':this.availableQty<150?'Low Stock':'In Stock'});
materialSchema.set('toJSON',{virtuals:true});
export default mongoose.model('Material',materialSchema);
