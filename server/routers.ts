import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { scrapeSofifaPlayers, scrapeSofifaPlayersBatch, downloadPlayerImages, scrapeSofifaTeams, downloadTeamImages, scrapeSofifaTeamDetails, scrapeSofifaTeamDetailsBatch } from "./scraperService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  scraper: router({
    extractPlayers: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'url' in val && typeof (val as any).url === 'string') {
          return { url: (val as any).url };
        }
        throw new Error('Invalid input: url is required');
      })
      .mutation(async ({ input }) => {
        return scrapeSofifaPlayers(input.url);
      }),
    
    extractPlayersBatch: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 
            'baseUrl' in val && typeof (val as any).baseUrl === 'string' &&
            'startOffset' in val && typeof (val as any).startOffset === 'number' &&
            'endOffset' in val && typeof (val as any).endOffset === 'number') {
          return {
            baseUrl: (val as any).baseUrl,
            startOffset: (val as any).startOffset,
            endOffset: (val as any).endOffset,
            step: (val as any).step || 60,
          };
        }
        throw new Error('Invalid input: baseUrl, startOffset, and endOffset are required');
      })
      .mutation(async ({ input }) => {
        return scrapeSofifaPlayersBatch(input.baseUrl, input.startOffset, input.endOffset, input.step);
      }),
    
    downloadImages: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'players' in val && Array.isArray((val as any).players)) {
          return { players: (val as any).players };
        }
        throw new Error('Invalid input: players array is required');
      })
      .mutation(async ({ input }) => {
        try {
          const zipBuffer = await downloadPlayerImages(input.players);
          return { success: true, data: zipBuffer.toString('base64'), message: 'ZIP gerado com sucesso' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          return { success: false, message: `Erro ao fazer download: ${errorMessage}` };
        }
      }),
    
    extractTeams: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'url' in val && typeof (val as any).url === 'string') {
          return { url: (val as any).url };
        }
        throw new Error('Invalid input: url is required');
      })
      .mutation(async ({ input }) => {
        return scrapeSofifaTeams(input.url);
      }),
    
    downloadTeamImages: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'teams' in val && Array.isArray((val as any).teams)) {
          return { teams: (val as any).teams };
        }
        throw new Error('Invalid input: teams array is required');
      })
      .mutation(async ({ input }) => {
        try {
          const zipBuffer = await downloadTeamImages(input.teams);
          return { success: true, data: zipBuffer.toString('base64'), message: 'ZIP gerado com sucesso' };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          return { success: false, message: `Erro ao fazer download: ${errorMessage}` };
        }
      }),
    
    extractTeamDetails: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 'url' in val && typeof (val as any).url === 'string') {
          return { url: (val as any).url };
        }
        throw new Error('Invalid input: url is required');
      })
      .mutation(async ({ input }) => {
        return scrapeSofifaTeamDetails(input.url);
      }),
    
    extractTeamDetailsBatch: publicProcedure
      .input((val: unknown) => {
        if (typeof val === 'object' && val !== null && 
            'baseUrl' in val && typeof (val as any).baseUrl === 'string' &&
            'startOffset' in val && typeof (val as any).startOffset === 'number' &&
            'endOffset' in val && typeof (val as any).endOffset === 'number') {
          return {
            baseUrl: (val as any).baseUrl,
            startOffset: (val as any).startOffset,
            endOffset: (val as any).endOffset,
            step: (val as any).step || 60,
          };
        }
        throw new Error('Invalid input: baseUrl, startOffset, and endOffset are required');
      })
      .mutation(async ({ input }) => {
        return scrapeSofifaTeamDetailsBatch(input.baseUrl, input.startOffset, input.endOffset, input.step);
      }),
  }),
});

export type AppRouter = typeof appRouter;
