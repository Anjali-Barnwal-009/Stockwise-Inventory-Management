import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Material from './models/Material.js';
import Transaction from './models/Transaction.js';
import RejectedAttempt from './models/RejectedAttempt.js';
dotenv.config();
await connectDB();
if (await Material.countDocuments()) {
  console.log('Seed skipped: materials already exist. To use sample data, run this against an empty database.');
  await mongoose.disconnect();
  process.exit(0);
}
const items = [
  {code:'RM-001',name:'Steel Sheet 2mm',unit:'KG',openingQty:500,availableQty:550},
  {code:'RM-002',name:'Aluminium Rod 10mm',unit:'Meter',openingQty:300,availableQty:350},
  {code:'RM-003',name:'Copper Wire 1.5mm',unit:'Meter',openingQty:1200,availableQty:0},
  {code:'RM-004',name:'ABS Plastic Granules',unit:'KG',openingQty:250,availableQty:150},
  {code:'RM-005',name:'Rubber Gasket',unit:'Nos',openingQty:150,availableQty:0},
  {code:'RM-006',name:'Industrial Paint (Grey)',unit:'Litre',openingQty:80,availableQty:100},
  {code:'RM-007',name:'Hex Bolt M8',unit:'Nos',openingQty:2000,availableQty:1500},
  {code:'RM-008',name:'Cotton Fabric (Dyed)',unit:'Meter',openingQty:400,availableQty:500},
];
const materials = await Material.insertMany(items);
const byCode = Object.fromEntries(materials.map(m=>[m.code,m]));
const history = [
  ['2026-12-01','Inward','RM-001',200,'PO-4411',700],
  ['2026-12-02','Outward','RM-001',150,'WO-2201',550],
  ['2026-12-03','Outward','RM-004',100,'WO-2202',150],
  ['2026-12-04','Inward','RM-002',50,'PO-4415',350],
  ['2026-12-05','Outward','RM-005',150,'WO-2203',0],
  ['2026-12-06','Inward','RM-006',20,'PO-4420',100],
  ['2026-12-07','Outward','RM-007',500,'WO-2205',1500],
  ['2026-12-08','Outward','RM-003',1200,'WO-2206',0],
  ['2026-12-09','Inward','RM-008',100,'PO-4425',500],
];
await Transaction.insertMany(history.map(([date,type,code,qty,reference,balanceAfter])=>({date:new Date(`${date}T12:00:00`),type,material:byCode[code]._id,materialCode:code,materialName:byCode[code].name,qty,reference,balanceAfter})));
await RejectedAttempt.insertMany([
  {date:new Date('2026-12-02T12:00:00'),type:'Outward',materialCode:'RM-004',requestedQty:300,availableQty:250,reference:'WO-2202',reason:'Insufficient stock'},
  {date:new Date('2026-12-03T12:00:00'),type:'Outward',materialCode:'RM-005',requestedQty:50,availableQty:0,reference:'WO-2203',reason:'Insufficient stock'}
]);
console.log('Sample inventory data inserted successfully.');
await mongoose.disconnect();
