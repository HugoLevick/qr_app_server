import { BadRequestException } from '@nestjs/common';

export function handleDbError(error: any) {
  if (error?.detail?.includes('already exists')) {
    throw new BadRequestException('El email ya está registrado');
  }
}
