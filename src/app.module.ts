import Keyv from 'keyv';

import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';

import { AuthModule } from './modules/auth/auth.module';
import { TestController } from './modules/test/test.controller';
import { TestService } from './modules/test/test.service';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // 全局缓存模块配置
    // 使用 Keyv 作为存储适配器，后续可无缝切换到 Redis（@keyv/redis）
    CacheModule.register({
      isGlobal: true, // 全局可用，无需在各模块重复导入
      max: 100, // 最大缓存条目数：100 条
      stores: [
        // Keyv 存储适配器配置（ttl 单位为毫秒）
        new Keyv({
          ttl: 300000, // 缓存过期时间：300000ms = 5 分钟
        }),
      ],
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [TestController],
  providers: [TestService],
})
export class AppModule {}
