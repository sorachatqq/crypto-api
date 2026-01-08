import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as path from 'path';

interface EncryptResponse {
  successful: boolean;
  error_code: string;
  data: { data1: string; data2: string } | null;
}

interface DecryptResponse {
  successful: boolean;
  error_code: string;
  data: { payload: string } | null;
}

interface Response<T> {
  body: T;
  status: number;
}

describe('Crypto APIs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Setup environment variables for RSA keys
    process.env.RSA_PRIVATE_KEY_PATH = path.join(
      __dirname,
      '../keys/private.pem',
    );
    process.env.RSA_PUBLIC_KEY_PATH = path.join(
      __dirname,
      '../keys/public.pem',
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('encrypt -> decrypt should return original payload', async () => {
    const payload = 'hello nest crypto';

    const enc = (await request(app.getHttpServer() as App)
      .post('/get-encrypt-data')
      .send({ payload })
      .expect(200)) as Response<EncryptResponse>;

    expect(enc.body.successful).toBe(true);
    expect(enc.body.data).not.toBeNull();
    if (enc.body.data) {
      expect(enc.body.data.data1).toBeDefined();
      expect(enc.body.data.data2).toBeDefined();

      const dec = (await request(app.getHttpServer() as App)
        .post('/get-decrypt-data')
        .send({ data1: enc.body.data.data1, data2: enc.body.data.data2 })
        .expect(200)) as Response<DecryptResponse>;

      expect(dec.body.successful).toBe(true);
      expect(dec.body.data).not.toBeNull();
      if (dec.body.data) {
        expect(dec.body.data.payload).toBe(payload);
      }
    }
  });

  it('should validate payload length ( > 2000 )', async () => {
    const payload = 'a'.repeat(2001);
    const res = (await request(app.getHttpServer() as App)
      .post('/get-encrypt-data')
      .send({ payload })) as Response<unknown>;

    expect(res.status).toBe(400);
  });
});
