
import { NextRequest, NextResponse } from 'next/server';
import { getReportById, getReportMessages, saveReportMessages } from '@/lib/db/repository';
import { answerReportQuestion } from '@/lib/server/deepseek';
import type { ReportChatMessage } from '@/lib/types';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReportById(id);
  if (!report) return NextResponse.json({ error: '报告不存在或已过期' }, { status: 404 });
  const messages = await getReportMessages(id);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await getReportById(id);
    if (!report) return NextResponse.json({ error: '报告不存在或已过期' }, { status: 404 });
    const body = (await request.json()) as { question?: unknown };
    if (typeof body.question !== 'string' || body.question.trim().length === 0) {
      return NextResponse.json({ error: '问题不能为空' }, { status: 400 });
    }
    const history = await getReportMessages(id);
    const answer = await answerReportQuestion(report, body.question, history);
    const now = new Date().toISOString();
    const messages: ReportChatMessage[] = [
      { id: `msg-${Date.now()}-u`, reportId: id, role: 'user', content: body.question.trim(), createdAt: now },
      { id: `msg-${Date.now()}-a`, reportId: id, role: 'assistant', content: answer, createdAt: new Date().toISOString() },
    ];
    await saveReportMessages(messages);
    return NextResponse.json({ answer, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : '追问失败';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
