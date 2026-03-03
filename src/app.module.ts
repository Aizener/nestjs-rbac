import { Module } from '@nestjs/common';

import { TestController } from './modules/test/test.controller';
import { TestService } from './modules/test/test.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [TestController],
  providers: [TestService],
})
export class AppModule {}
