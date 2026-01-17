const crypto = require('crypto');
const logger = require('./logger');

/**
 * AES-256-GCM encryption service for sensitive data (AWS credentials)
 * 
 * Features:
 * - AES-256-GCM authenticated encryption
 * - Random IV (Initialization Vector) per encryption
 * - Authentication tag for data integrity
 * - Base64 encoding for database storage
 * 
 * Security:
 * - Uses environment variable for master key
 * - IV prevents pattern analysis
 * - Auth tag prevents tampering
 */

// Master encryption key from environment (MUST be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    logger.error('❌ ENCRYPTION_KEY not set or invalid length (must be 64 hex chars = 32 bytes)');
    logger.error('   Generate with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
    throw new Error('ENCRYPTION_KEY environment variable required (64 hex characters)');
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypt sensitive data (AWS credentials, API keys)
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: iv:authTag:ciphertext (base64)
 * 
 * @example
 * const encrypted = encrypt('AKIAIOSFODNN7EXAMPLE');
 * // Returns: "a1b2c3d4...iv:e5f6g7h8...tag:i9j0k1l2...ciphertext"
 */
function encrypt(plaintext) {
    try {
        // Generate random IV (12 bytes recommended for GCM)
        const iv = crypto.randomBytes(12);

        // Create cipher
        const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);

        // Encrypt data
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        // Return format: iv:authTag:ciphertext (all base64)
        const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;

        logger.debug('Data encrypted successfully', {
            ivLength: iv.length,
            tagLength: authTag.length,
            ciphertextLength: encrypted.length
        });

        return result;
    } catch (error) {
        logger.error('Encryption failed', { error: error.message });
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt encrypted data
 * 
 * @param {string} encryptedData - Encrypted string from encrypt()
 * @returns {string} Original plaintext
 * 
 * @example
 * const decrypted = decrypt(encryptedAwsKey);
 * // Returns: "AKIAIOSFODNN7EXAMPLE"
 */
function decrypt(encryptedData) {
    try {
        // Parse encrypted data
        const [ivB64, authTagB64, ciphertext] = encryptedData.split(':');

        if (!ivB64 || !authTagB64 || !ciphertext) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');

        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
        decipher.setAuthTag(authTag);

        // Decrypt data
        let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        logger.debug('Data decrypted successfully');

        return decrypted;
    } catch (error) {
        logger.error('Decryption failed', {
            error: error.message,
            code: error.code
        });
        throw new Error('Failed to decrypt data - data may be corrupted or tampered');
    }
}

/**
 * Check if data is encrypted (has correct format)
 * 
 * @param {string} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
function isEncrypted(data) {
    if (!data || typeof data !== 'string') return false;

    const parts = data.split(':');
    return parts.length === 3 && parts.every(part => part.length > 0);
}

module.exports = {
    encrypt,
    decrypt,
    isEncrypted
};
