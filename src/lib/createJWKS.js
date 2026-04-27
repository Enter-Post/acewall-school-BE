import { generateKeyPair, exportJWK } from "jose";

export async function createKeys() {
    const { publicKey, privateKey } = await generateKeyPair("RS256");

    return { publicKey, privateKey };
}

export async function buildJWKS(publicKey) {
    const jwk = await exportJWK(publicKey);

    jwk.use = "sig";
    jwk.alg = "RS256";
    jwk.kid = "key-1"; // important for rotation

    return {
        keys: [jwk],
    };
}