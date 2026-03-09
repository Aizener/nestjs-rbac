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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthUser } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDeviceNameDto } from './dto/update-device-name.dto';
import { SessionsService } from './sessions.service';

@ApiTags('设备/会话')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: '我的设备列表' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录' })
  findMySessions(@Req() req: Request & { user: AuthUser }) {
    return this.sessionsService.findMySessions(req.user.userId);
  }

  @Delete(':jti')
  @ApiOperation({ summary: '踢掉指定设备' })
  @ApiParam({ name: 'jti', description: '会话 JWT ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录' })
  @ApiResponse({ status: 404, description: '会话不存在或非本人' })
  revokeByJti(
    @Req() req: Request & { user: AuthUser },
    @Param('jti') jti: string,
  ) {
    return this.sessionsService.revokeByJti(req.user.userId, jti);
  }

  @Patch(':jti')
  @ApiOperation({ summary: '更新设备名称' })
  @ApiParam({ name: 'jti', description: '会话 JWT ID' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录' })
  @ApiResponse({ status: 404, description: '会话不存在或非本人' })
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
