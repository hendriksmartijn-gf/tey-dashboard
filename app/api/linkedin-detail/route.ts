import { NextResponse } from 'next/server';
import { getLinkedInDetailRows } from '@/lib/linkedin-detail';

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getLinkedInDetailRows();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
