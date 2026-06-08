import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionOptions = {
      dbName: "District-QA",
      tls: true,
    };

    // Add TLS certificates if provided in environment
    if (process.env.MONGODB_CA_CERT) {
      connectionOptions.tlsCAFile = process.env.MONGODB_CA_CERT;
    }
    if (process.env.MONGODB_CLIENT_CERT) {
      connectionOptions.tlsCertificateKeyFile = process.env.MONGODB_CLIENT_CERT;
    }

    await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    console.log("DB connected succcesfully");
  } catch (error) {
    console.log("error in DB connection", error);
  }
};
