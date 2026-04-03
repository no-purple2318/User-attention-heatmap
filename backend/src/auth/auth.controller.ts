import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    @Post('login')
    async login(@Body() body: any) {
        const { email, password } = body;
        if (!email || !password) return { message: 'Email and password required', user: null };

        let user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new UnauthorizedException('User does not exist');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        const token = this.jwtService.sign({ sub: user.id, email: user.email });
        return { message: 'Success', user: { id: user.id, email: user.email }, token };
    }

    @Post('register')
    async register(@Body() body: any) {
        const { email, password } = body;
        if (!email || !password) return { message: 'Email and password required', user: null };

        let user = await this.prisma.user.findUnique({ where: { email } });
        if (user) return { message: 'User already exists', user: null };

        const passwordHash = await bcrypt.hash(password, 10);
        user = await this.prisma.user.create({
            data: { email, passwordHash }
        });

        const token = this.jwtService.sign({ sub: user.id, email: user.email });
        return { message: 'Success', user: { id: user.id, email: user.email }, token };
    }
}
