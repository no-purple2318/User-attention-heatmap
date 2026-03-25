import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
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
