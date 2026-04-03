import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TrackModule } from './track/track.module';

@Module({
  imports: [PrismaModule, AuthModule, TrackModule],
})
export class AppModule { }
