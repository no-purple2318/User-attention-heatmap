import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthController {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(body: any): Promise<{
        message: string;
        user: null;
        token?: undefined;
    } | {
        message: string;
        user: {
            id: string;
            email: string;
        };
        token: string;
    }>;
    register(body: any): Promise<{
        message: string;
        user: null;
        token?: undefined;
    } | {
        message: string;
        user: {
            id: string;
            email: string;
        };
        token: string;
    }>;
}
