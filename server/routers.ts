import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { spawn } from "child_process";
import path from "path";

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
        return new Promise((resolve, reject) => {
          const pythonProcess = spawn('python3.11', [
            path.join(process.cwd(), 'server', 'scraper.py'),
            input.url
          ]);

          let output = '';
          let errorOutput = '';

          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });

          pythonProcess.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Scraper error: ${errorOutput}`));
              return;
            }

            try {
              const result = JSON.parse(output);
              resolve(result);
            } catch (parseError) {
              reject(new Error(`Failed to parse scraper output: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`));
            }
          });

          pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to start scraper: ${err.message}`));
          });
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
