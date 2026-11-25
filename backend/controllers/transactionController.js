import Material from '../models/Material.js';
import Transaction from '../models/Transaction.js';
import RejectedAttempt from '../models/RejectedAttempt.js';

export async function createTransaction(req, res) {
  const { date, type, materialId, qty, reference = '-' } = req.body;
  const amount = Number(qty);
  if (!['Inward', 'Outward'].includes(type) || !materialId || !date || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Transaction type, date, material and positive quantity are required.' });
  }
  try {
    const before = await Material.findById(materialId);
    if (!before) return res.status(404).json({ success: false, message: 'Material not found.' });

    // Atomic stock change works with a local standalone MongoDB server too (no replica-set transactions needed).
    const stockFilter = type === 'Outward' ? { _id: materialId, availableQty: { $gte: amount } } : { _id: materialId };
    const stockChange = type === 'Inward' ? amount : -amount;
    const updated = await Material.findOneAndUpdate(stockFilter, { $inc: { availableQty: stockChange } }, { new: true });

    if (!updated && type === 'Outward') {
      const rejection = { date: new Date(date), type, materialCode: before.code, requestedQty: amount, availableQty: before.availableQty, reference, reason: 'Insufficient stock' };
      await RejectedAttempt.create(rejection);
      return res.status(409).json({ success: false, message: `Issue rejected. Requested ${amount}, available ${before.availableQty} for ${before.code} (${before.name}). No stock was changed.` });
    }
    if (!updated) return res.status(404).json({ success: false, message: 'Material not found.' });

    try {
      const tx = await Transaction.create({ date: new Date(date), type, material: updated._id, materialCode: updated.code, materialName: updated.name, qty: amount, reference: reference || '-', balanceAfter: updated.availableQty });
      return res.status(201).json({ success: true, message: 'Transaction accepted', data: { material: updated, transaction: tx } });
    } catch (historyError) {
      // If history insert fails, reverse the stock change so inventory and history remain consistent.
      await Material.updateOne({ _id: updated._id }, { $inc: { availableQty: -stockChange } });
      throw historyError;
    }
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Transaction failed.' });
  }
}

export async function listTransactions(req, res) {
  try {
    const { search = '', type = 'All', from = '', to = '' } = req.query;
    const q = {};
    if (search) q.$or = [{ materialCode: { $regex: search, $options: 'i' } }, { materialName: { $regex: search, $options: 'i' } }];
    if (type !== 'All') q.type = type;
    if (from || to) q.date = { ...(from ? { $gte: new Date(`${from}T00:00:00`) } : {}), ...(to ? { $lte: new Date(`${to}T23:59:59.999`) } : {}) };
    const rows = await Transaction.find(q).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
}
