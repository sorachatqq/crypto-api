import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';

type EncryptResult = { data1: string; data2: string };
type DecryptResult = { payload: string };

function b64(buf: Buffer) {
  return buf.toString('base64');
}
function unb64(s: string) {
  return Buffer.from(s, 'base64');
}

@Injectable()
export class CryptoService {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor() {
    const privPath = process.env.RSA_PRIVATE_KEY_PATH;
    const pubPath = process.env.RSA_PUBLIC_KEY_PATH;

    if (!privPath || !pubPath) {
      throw new Error('Missing RSA_PRIVATE_KEY_PATH or RSA_PUBLIC_KEY_PATH');
    }

    this.privateKey = fs.readFileSync(privPath, 'utf8');
    this.publicKey = fs.readFileSync(pubPath, 'utf8');
  }

  encrypt(payload: string): EncryptResult {
    if (typeof payload !== 'string' || payload.length > 2000) {
      throw new BadRequestException('Invalid payload');
    }

    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(payload, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    const data2 = `${b64(iv)}.${b64(tag)}.${b64(ciphertext)}`;

    const keyPack = `${b64(aesKey)}:${b64(iv)}`;

    const encKey = crypto.privateEncrypt(
      { key: this.privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(keyPack, 'utf8'),
    );

    const data1 = b64(encKey);

    return { data1, data2 };
  }

  decrypt(data1: string, data2: string): DecryptResult {
    if (!data1 || !data2) throw new BadRequestException('data1/data2 required');

    let keyPack: string;
    try {
      const decKey = crypto.publicDecrypt(
        { key: this.publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        unb64(data1),
      );
      keyPack = decKey.toString('utf8');
    } catch {
      throw new BadRequestException('Invalid data1');
    }

    const [aesKeyB64, ivB64] = keyPack.split(':');
    if (!aesKeyB64 || !ivB64) throw new BadRequestException('Invalid key pack');

    const aesKey = unb64(aesKeyB64);
    const ivFromKey = unb64(ivB64);

    const parts = data2.split('.');
    if (parts.length !== 3)
      throw new BadRequestException('Invalid data2 format');

    const iv = unb64(parts[0]);
    const tag = unb64(parts[1]);
    const ciphertext = unb64(parts[2]);

    if (!crypto.timingSafeEqual(iv, ivFromKey)) {
      throw new BadRequestException('IV mismatch');
    }

    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return { payload: plaintext.toString('utf8') };
    } catch {
      throw new BadRequestException('Decrypt failed');
    }
  }
}
