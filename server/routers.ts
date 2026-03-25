import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
        try {
          const response = await fetch('/api/scraper/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: input.url }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          return await response.json();
        } catch (error) {
          throw new Error(`Failed to extract players: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
