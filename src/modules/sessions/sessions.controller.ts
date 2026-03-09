import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDeviceNameDto } from './dto/update-device-name.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /** 我的设备列表 */
  @Get()
  findMySessions(@Req() req: Request & { user: AuthUser }) {
    return this.sessionsService.findMySessions(req.user.userId);
  }

  /** 踢掉指定设备 */
  @Delete(':jti')
  revokeByJti(
    @Req() req: Request & { user: AuthUser },
    @Param('jti') jti: string,
  ) {
    return this.sessionsService.revokeByJti(req.user.userId, jti);
  }

  /** 更新设备名称 */
  @Patch(':jti')
  updateDeviceName(
    @Req() req: Request & { user: AuthUser },
    @Param('jti') jti: string,
    @Body() dto: UpdateDeviceNameDto,
  ) {
    return this.sessionsService.updateDeviceName(
      req.user.userId,
      jti,
      dto.deviceName,
    );
  }
}
