import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async login(email: string, password: string, role: string = 'USER') {
        if (!email || !password) {
            throw new UnauthorizedException('Email and password are required');
        }

        let user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    passwordHash: 'dummy-hash',
                    role,
                },
            });
        }

        return { user, message: 'Logged in successfully' };
    }
}
