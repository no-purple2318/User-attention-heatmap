import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// In a full production app, you might use @prisma/adapter-pg explicitly if edge deployment requires it.
// For standard container workloads or VM, the native Prisma Client handles Pg connections via Pool organically.

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
