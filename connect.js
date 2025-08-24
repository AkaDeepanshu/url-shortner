import mongoose from "mongoose";

async function connectToDB(url) {
  await mongoose.connect(url);
}

export { connectToDB };
