import { verifyKey } from 'discord-interactions';

export function verifyDiscordRequest(publicKey, signature, timestamp, body) {
    try {
        return verifyKey(
            JSON.stringify(body),
            signature,
            timestamp,
            publicKey
        );
    } catch (error) {
        console.error(error);
        return false;
    }
}