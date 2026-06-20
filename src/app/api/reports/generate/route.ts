
import { NextRequest, NextResponse } from 'next/server';
import { saveReport } from '@/lib/db/repository';
import { generateServerReport, validateUserProfile } from '@/lib/server/report-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userProfile = validateUserProfile(body);
    const report = await generateServerReport(userProfile);
    await saveReport(report);
    return NextResponse.json({ reportId: report.id, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : '报告生成失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
