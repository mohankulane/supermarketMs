import Shift from "../models/Shift.model.js";

export const findShifts = () => Shift.find().sort({ createdAt: -1 });

export const openShift = (data) =>
  Shift.create({
    cashier: data.cashier,
    openingCash: data.openingCash,
    status: "Open",
  });

export async function closeShift(id, data) {
  const shift = await Shift.findById(id);
  if (!shift) return null;
  shift.closingCash = data.closingCash;
  shift.expectedCash = data.expectedCash;
  shift.variance = Number(data.closingCash) - Number(data.expectedCash);
  shift.status = "Closed";
  return shift.save();
}

export const deleteShift = (id) => Shift.findByIdAndDelete(id);
