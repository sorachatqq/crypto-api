import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DecryptRequestDto {
  @ApiProperty({ description: 'First encrypted data', type: String })
  @IsString()
  @IsNotEmpty()
  data1: string;

  @ApiProperty({ description: 'Second encrypted data', type: String })
  @IsString()
  @IsNotEmpty()
  data2: string;
}
