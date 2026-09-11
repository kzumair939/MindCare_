package com.example.mindcare.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * JPA Attribute Converter that encrypts sensitive text columns at rest using AES-256-GCM.
 * Prepends a 12-byte initialization vector (IV) and a recognizable 'ENC:' prefix.
 * Backward-compatible: If existing data in the DB does not start with 'ENC:', it is returned as plain text.
 */
@Slf4j
@Component
@Converter
public class AesDataEncryptorConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;
    private static final String ENCRYPTED_PREFIX = "ENC:";

    private static SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesDataEncryptorConverter(
            @Value("${app.security.encryption-key:${app.jwt.secret:MindCareDefaultSuperSecureSecretKeyForAes256Encryption!}}")
            String encryptionSecret
    ) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(encryptionSecret.getBytes(StandardCharsets.UTF_8));
            secretKey = new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            log.error("Failed to initialize AES-256 encryption key", e);
            throw new IllegalStateException("Could not initialize AES-256 SecretKey", e);
        }
    }

    // Default constructor for JPA instantiation
    public AesDataEncryptorConverter() {
        if (secretKey == null) {
            try {
                String fallbackSecret = "MindCareDefaultSuperSecureSecretKeyForAes256Encryption!";
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                byte[] keyBytes = sha256.digest(fallbackSecret.getBytes(StandardCharsets.UTF_8));
                secretKey = new SecretKeySpec(keyBytes, "AES");
            } catch (Exception e) {
                log.error("Failed to initialize fallback AES-256 SecretKey", e);
            }
        }
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return attribute;
        }

        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherText = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return ENCRYPTED_PREFIX + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Encryption error during column persistence", e);
            throw new IllegalStateException("Failed to encrypt data at rest", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return dbData;
        }

        // Backward compatibility: If row was stored prior to encryption, return plain text
        if (!dbData.startsWith(ENCRYPTED_PREFIX)) {
            return dbData;
        }

        try {
            String payload = dbData.substring(ENCRYPTED_PREFIX.length());
            byte[] decoded = Base64.getDecoder().decode(payload);

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Decryption error during column retrieval", e);
            throw new IllegalStateException("Failed to decrypt data at rest", e);
        }
    }
}
