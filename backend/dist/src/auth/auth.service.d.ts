import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    login(email: string, password: string, role?: string): Promise<{
        user: {
            id: string;
            email: string;
            passwordHash: string;
            role: string;
            createdAt: Date;
        };
        message: string;
    }>;
}
