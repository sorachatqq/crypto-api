import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class EncryptRequestDto {
  @ApiProperty({
    type: String,
    minLength: 0,
    maxLength: 2000,
    description: 'Payload to encrypt',
    example: 'hello primo',
  })
  @IsString()
  @MaxLength(2000)
  payload: string;
}
