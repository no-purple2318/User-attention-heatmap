import { TrackService } from './track.service';
export declare class TrackController {
    private readonly trackService;
    constructor(trackService: TrackService);
    startSession(body: {
        userId: string;
        url: string;
    }): Promise<{
        sessionId: string;
    }>;
    trackEvents(body: {
        userId: string;
        sessionId: string;
        events: any[];
    }): Promise<{
        success: boolean;
        count: number;
    }>;
}
