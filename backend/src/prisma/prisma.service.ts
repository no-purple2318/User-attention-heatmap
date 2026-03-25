import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const url = process.env.DATABASE_URL || 'file:./dev.db';
        const adapter = new PrismaLibSql({ url });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }
}
