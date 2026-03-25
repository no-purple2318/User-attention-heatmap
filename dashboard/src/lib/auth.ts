import { SignJWT, jwtVerify } from "jose";

// In production, ensure you set a strong secret in .env
// e.g. JWT_SECRET=your-super-secret-key
const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET || "fallback-secret-for-dev-only-do-not-use-in-prod";
    return new TextEncoder().encode(secret);
};

export async function signJwt(payload: { id: string; email: string; role: string }) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getJwtSecretKey());

    return token;
}

export async function verifyJwt(token: string) {
    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey());
        return payload as { id: string; email: string; role: string };
    } catch (error) {
        return null;
    }
}
