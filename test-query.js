import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const CompanySchema = new mongoose.Schema({}, { strict: false, collection: 'companies' });
const Company = mongoose.model('Company', CompanySchema);

async function test() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected");
    const name = "VitalTech Solutions Private Limited";
    const placeId = "ChIJtWpvaZLVdzkRvrwfds8QTIN";
    const duplicates = await Company.find({ $or: [{ name: { $in: [name] } }, { placeId: { $in: [placeId] } }] }, { name: 1, placeId: 1 });
    console.log("Found:", duplicates);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
test();
