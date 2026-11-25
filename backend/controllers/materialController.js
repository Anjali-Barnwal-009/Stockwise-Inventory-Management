import Material from '../models/Material.js';
import Transaction from '../models/Transaction.js';

// Generate the next code from the highest numeric code already stored.
// Do not rely on createdAt ordering because seed records can share timestamps.
const codeFor = async () => {
  const existingCodes = await Material.find({}, { code: 1, _id: 0 }).lean();
  const highest = existingCodes.reduce((max, item) => {
    const match = /^RM-(\d+)$/.exec(item.code || '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `RM-${String(highest + 1).padStart(3, '0')}`;
};

export async function listMaterials(req, res) {
  try {
    const { search = '', unit = 'All', status = 'All' } = req.query;
    const query = {};
    if (search) query.$or = [{ code: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];
    if (unit !== 'All') query.unit = unit;
    if (status === 'Out of Stock') query.availableQty = 0;
    else if (status === 'Low Stock') query.availableQty = { $gt: 0, $lt: 150 };
    else if (status === 'In Stock') query.availableQty = { $gte: 150 };
    const data = await Material.find(query).sort({ code: 1 });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function createMaterial(req, res) {
  try {
    const { name, unit, openingQty = 0 } = req.body;
    const quantity = Number(openingQty);
    if (!name?.trim() || !unit || !Number.isFinite(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Name, unit and valid opening quantity are required.' });
    }

    // Retry if another request creates the same code at almost the same time.
    let item;
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = await codeFor();
      try {
        item = await Material.create({ code, name: name.trim(), unit, openingQty: quantity, availableQty: quantity });
        break;
      } catch (error) {
        if (error.code !== 11000 || attempt === 2) throw error;
      }
    }
    res.status(201).json({ success: true, data: item });
  } catch (e) {
    res.status(400).json({ success: false, message: e.code === 11000 ? 'Could not generate a unique material code. Please try again.' : e.message });
  }
}

export async function updateMaterial(req, res) {
  try {
    const item = await Material.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Material not found' });
    const hasTransactions = await Transaction.exists({ material: item._id });
    item.name = req.body.name?.trim() || item.name;
    item.unit = req.body.unit || item.unit;
    if (!hasTransactions && req.body.openingQty !== undefined) {
      const qty = Number(req.body.openingQty);
      if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ success: false, message: 'Opening quantity cannot be negative' });
      item.openingQty = qty;
      item.availableQty = qty;
    }
    await item.save();
    res.json({ success: true, data: item });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
}

export async function deleteMaterial(req, res) {
  try {
    const item = await Material.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Material not found' });
    if (await Transaction.exists({ material: item._id })) return res.status(409).json({ success: false, message: 'Cannot delete material with transaction history.' });
    await item.deleteOne();
    res.json({ success: true, message: 'Material deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}
