import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep deployment-only compressed database parts out of traced serverless bundles.
  // The prebuild script expands them to data/admission_clean.db; only that runtime DB is needed.
  outputFileTracingExcludes: {
    '*': [
      './data/admission_clean.db.gz*',
      './data/admission_reco_vendor_2026.*',
      './data/admission_deploy*.db',
      './data/admission_clean_vendor_2026.*',
      './data/admission_clean_before_*.db',
      './data/admission_clean.backup-before-*.db',
      './data/raw-admissions/**',
      './data/vendor-2026/**',
      './scripts/data/**',
    ],
  },
  allowedDevOrigins: ['*.dev.coze.site', '192.168.56.1'],
};

export default nextConfig;
