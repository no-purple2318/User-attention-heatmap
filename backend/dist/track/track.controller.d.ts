import { PrismaService } from '../prisma/prisma.service';
export declare class TrackController {
    private prisma;
    constructor(prisma: PrismaService);
    trackEvents(req: any, body: any): Promise<{
        message: string;
        count: number;
    }>;
    endSession(req: any, body: {
        sessionId: string;
    }): Promise<{
        message: string;
    }>;
}
