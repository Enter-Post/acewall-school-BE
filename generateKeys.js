import { generateKeyPairSync } from "crypto";
import fs from "fs";

// Generate RSA key pair
const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem"
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem"
  }
});

// Create keys folder if not exists
if (!fs.existsSync("./keys")) {
  fs.mkdirSync("./keys");
}

// Save private key
fs.writeFileSync("./keys/private.key", privateKey);
console.log("✅ Private key saved to ./keys/private.key");

// Save public key
fs.writeFileSync("./keys/public.key", publicKey);
console.log("✅ Public key saved to ./keys/public.key");