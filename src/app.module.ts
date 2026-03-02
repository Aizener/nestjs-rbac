import { Module } from '@nestjs/common';
import { TestController } from './modules/test/test.controller';
import { TestService } from './modules/test/test.service';

@Module({
  imports: [],
  controllers: [TestController],
  providers: [TestService],
})
export class AppModule {}
