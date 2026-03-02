import { Injectable } from '@nestjs/common';

@Injectable()
export class TestService {
  getHello(): { msg: string } {
    return {
      msg: 'Hello World',
    };
  }
}
