import { Module } from '@nestjs/common';
import { CryptoModule } from './modules/crypto/crypto.module';

@Module({
  imports: [CryptoModule],
})
export class AppModule {}
