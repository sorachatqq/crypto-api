import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';
import { EncryptRequestDto } from './dto/encrypt-request.dto';
import { DecryptRequestDto } from './dto/decrypt-request.dto';

class ApiOkEncrypt {
  successful: boolean;
  error_code: string;
  data: null | { data1: string; data2: string };
}
class ApiOkDecrypt {
  successful: boolean;
  error_code: string;
  data: null | { payload: string };
}

@ApiTags('crypto')
@Controller()
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post('/get-encrypt-data')
  @HttpCode(200)
  @ApiBody({ type: EncryptRequestDto })
  @ApiResponse({ status: 200, type: ApiOkEncrypt })
  encrypt(@Body() dto: EncryptRequestDto) {
    const { data1, data2 } = this.cryptoService.encrypt(dto.payload);
    return {
      successful: true,
      error_code: '',
      data: { data1, data2 },
    };
  }

  @Post('/get-decrypt-data')
  @HttpCode(200)
  @ApiBody({ type: DecryptRequestDto })
  @ApiResponse({ status: 200, type: ApiOkDecrypt })
  decrypt(@Body() dto: DecryptRequestDto) {
    const { payload } = this.cryptoService.decrypt(dto.data1, dto.data2);
    return {
      successful: true,
      error_code: '',
      data: { payload },
    };
  }
}
