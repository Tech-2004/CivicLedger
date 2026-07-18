import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  // Transpile the workspace source packages (they ship raw .ts).
  transpilePackages: ["@civicledger/shared", "@civicledger/server"],
  // Keep native/server-only DB drivers out of the bundle.
  serverExternalPackages: ["@neondatabase/serverless", "pg"],
  eslint: {
    // Skeleton: don't fail the build on lint; tighten later.
    ignoreDuringBuilds: true,
  },
};

// withWorkflow wires the DevKit code transforms + the generated runtime routes
// under /.well-known/workflow/v1/*. It scans workflows/ for the directives.
export default withWorkflow(nextConfig);
