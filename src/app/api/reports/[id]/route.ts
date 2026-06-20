
import { NextRequest, NextResponse } from 'next/server';
import { getReportById } from '@/lib/db/repository';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) return NextResponse.json({ error: '报告不存在或已过期' }, { status: 404 });
  return NextResponse.json({ reportId: id, report });
}
