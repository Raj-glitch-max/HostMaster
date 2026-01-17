const { encrypt, decrypt, isEncrypted } = require('../src/utils/encryption');

/**
 * Encryption Utility Tests
 * 
 * Tests AES-256-GCM encryption/decryption functionality
 */

// Mock environment variable for testing
process.env.ENCRYPTION_KEY = '92cafb5a03df9cf5c0eab6601b0e6b079982a7ee84eb020547422ca43d569391';

describe('Encryption Utility', () => {

    describe('encrypt()', () => {
        it('should encrypt plaintext successfully', () => {
            const plaintext = 'AKIAIOSFODNN7EXAMPLE';
            const encrypted = encrypt(plaintext);

            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).not.toBe(plaintext);

            // Check format: iv:authTag:ciphertext (all base64)
            const parts = encrypted.split(':');
            expect(parts).toHaveLength(3);
        });

        it('should produce different output for same input (random IV)', () => {
            const plaintext = 'test-data';
            const encrypted1 = encrypt(plaintext);
            const encrypted2 = encrypt(plaintext);

            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should handle empty strings', () => {
            const encrypted = encrypt('');
            expect(encrypted).toBeDefined();
            expect(decrypt(encrypted)).toBe('');
        });
    });

    describe('decrypt()', () => {
        it('should decrypt encrypted data successfully', () => {
            const plaintext = 'AKIAIOSFODNN7EXAMPLE';
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should handle AWS access keys', () => {
            const awsKey = 'AKIAIOSFODNN7EXAMPLE';
            const encrypted = encrypt(awsKey);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(awsKey);
        });

        it('should handle AWS secret keys', () => {
            const awsSecret = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
            const encrypted = encrypt(awsSecret);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(awsSecret);
        });

        it('should throw error for invalid encrypted data', () => {
            expect(() => decrypt('invalid-data')).toThrow();
        });

        it('should throw error for tampered data', () => {
            const plaintext = 'test-data';
            const encrypted = encrypt(plaintext);

            // Tamper with the ciphertext
            const parts = encrypted.split(':');
            parts[2] = parts[2].slice(0, -1) + 'X';  // Change last char
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow();
        });
    });

    describe('isEncrypted()', () => {
        it('should return true for encrypted data', () => {
            const encrypted = encrypt('test');
            expect(isEncrypted(encrypted)).toBe(true);
        });

        it('should return false for plaintext', () => {
            expect(isEncrypted('plaintext')).toBe(false);
        });

        it('should return false for invalid format', () => {
            expect(isEncrypted('a:b')).toBe(false);
            expect(isEncrypted('a:b:c:d')).toBe(false);
        });

        it('should return false for null/undefined', () => {
            expect(isEncrypted(null)).toBe(false);
            expect(isEncrypted(undefined)).toBe(false);
        });
    });

    describe('Round-trip encryption', () => {
        it('should handle various data types', () => {
            const testCases = [
                'simple text',
                'Text with spaces and punctuation!',
                'Unicode: 你好世界 🚀',
                '{"json": "data", "number": 123}',
                'a'.repeat(1000)  // Long string
            ];

            testCases.forEach(testCase => {
                const encrypted = encrypt(testCase);
                const decrypted = decrypt(encrypted);
                expect(decrypted).toBe(testCase);
            });
        });
    });
});
