import { IsEmail, IsString, MinLength, Matches, Length } from 'class-validator';

export class RegisterEmployeeDto {
  @IsString()
  @Length(8, 8)
  @Matches(/^\d{8}$/, { message: 'inviteCode must be 8 digits' })
  inviteCode: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
