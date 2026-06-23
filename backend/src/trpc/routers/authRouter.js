import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import { ensureProfileForAuthContext } from "../../models/clerkSyncModel.js";

export const authRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ensureProfileForAuthContext(ctx.authContext);
  }),
});
